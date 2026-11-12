/* Buddy mit Buchhaltung als eigenständige App (z. B. über GitHub Pages).
   Stellt dieselben Schnittstellen bereit, die die App sonst in Claude nutzt –
   nur liegt alles in IndexedDB auf diesem Gerät. Übertragen zwischen Geräten
   geht über die Komplett-Sicherung (Mehr → Daten übertragen). */
(function(){
  "use strict";
  /* Daran erkennt Buddy, dass es als App läuft (Trainingshistorie: keine). */
  window.__APP_BASE__ = Array.isArray(window.__APP_BASE__) ? window.__APP_BASE__ : [];
  const DB_NAME = "buddy-buchhaltung", DB_VER = 1;
  let dbp = null;
  function open(){
    if(dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = () => {
        const d = r.result;
        if(!d.objectStoreNames.contains("docs")) d.createObjectStore("docs");
        if(!d.objectStoreNames.contains("files")) d.createObjectStore("files");
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  function tx(store, mode, fn){
    return open().then(d => new Promise((res, rej) => {
      const t = d.transaction(store, mode), s = t.objectStore(store);
      let out; const q = fn(s);
      if(q) q.onsuccess = () => { out = q.result; };
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error || { code: "unavailable" });
      t.onabort = () => rej(t.error || { code: "unavailable" });
    }));
  }
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const snap = (path, v) => ({ id: path.split("/").pop(), exists: v !== undefined,
    data: () => clone(v), metadata: { fromCache: false, hasPendingWrites: false } });

  function docRef(path){
    return {
      id: path.split("/").pop(), path,
      get: () => tx("docs", "readonly", s => s.get(path)).then(v => snap(path, v)),
      set: data => tx("docs", "readwrite", s => s.put(clone(data), path)).then(() => {}),
      update: data => tx("docs", "readonly", s => s.get(path)).then(v => {
        if(v === undefined) throw { code: "invalid_argument" };
        return tx("docs", "readwrite", s => s.put(Object.assign(v, clone(data)), path));
      }).then(() => {}),
      delete: () => tx("docs", "readwrite", s => s.delete(path)).then(() => {}),
      collection: c => colRef(path + "/" + c)
    };
  }
  function colRef(path){
    const depth = path.split("/").length + 1;
    return {
      path,
      doc: id => docRef(path + "/" + (id || ("d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)))),
      get: () => open().then(d => new Promise((res, rej) => {
        const t = d.transaction("docs", "readonly"), s = t.objectStore("docs"), docs = [];
        const range = IDBKeyRange.bound(path + "/", path + "/￿");
        const c = s.openCursor(range);
        c.onsuccess = () => {
          const cur = c.result;
          if(!cur){ res({ docs, size: docs.length, empty: !docs.length }); return; }
          if(String(cur.key).split("/").length === depth) docs.push(snap(String(cur.key), cur.value));
          cur.continue();
        };
        c.onerror = () => rej({ code: "unavailable" });
      }))
    };
  }
  const db = { doc: docRef, collection: colRef };

  /* Belege als echte Dateien in IndexedDB. */
  const urls = {};
  const assets = {
    upload: async (blob, opt) => {
      const id = (opt && opt.id) || ("l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
      const type = (opt && opt.type) || blob.type || "application/octet-stream";
      const b = blob.type === type ? blob : new Blob([blob], { type });
      try { await tx("files", "readwrite", s => s.put(b, id)); }
      catch(e){ throw { code: e && e.name === "QuotaExceededError" ? "quota_or_state" : "upstream_error", message: String(e && e.message || e) }; }
      return { id, url: urls[id] = URL.createObjectURL(b), sizeBytes: b.size, contentType: type };
    },
    get: async id => (await tx("files", "readonly", s => s.get(id))) || null,
    delete: async id => {
      const had = !!(await tx("files", "readonly", s => s.getKey(id)));
      await tx("files", "readwrite", s => s.delete(id));
      if(urls[id]){ URL.revokeObjectURL(urls[id]); delete urls[id]; }
      return { deleted: had };
    },
    list: async () => ({ assets: [], usage: {} })
  };

  /* Dateien speichern: am Handy über das Teilen-Menü (Dateien, AirDrop, Mail …),
     am Laptop als normaler Download. */
  const MIME = { csv: "text/csv", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip", json: "application/json", pdf: "application/pdf", jpg: "image/jpeg", png: "image/png" };
  const downloads = {
    save: async ({ filename, data }) => {
      const ext = String(filename).split(".").pop().toLowerCase();
      const blob = data instanceof Blob ? data : new Blob([data], { type: MIME[ext] || "application/octet-stream" });
      const typed = new File([blob], filename, { type: MIME[ext] || blob.type || "application/octet-stream" });
      const touch = matchMedia("(pointer: coarse)").matches;
      if(touch && navigator.canShare && navigator.canShare({ files: [typed] })){
        try { await navigator.share({ files: [typed], title: filename }); return { status: "saved" }; }
        catch(e){
          if(e && e.name === "AbortError") throw { code: "declined" };
          /* Hat das Packen zu lange gedauert, verlangt das Handy einen neuen Tipp. */
          if(e && e.name === "NotAllowedError") return shareByTap(typed);
        }
      }
      const u = URL.createObjectURL(typed), a = document.createElement("a");
      a.href = u; a.download = filename; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 60000);
      return { status: "saved" };
    }
  };
  function shareByTap(file){
    return new Promise((res, rej) => {
      const w = document.createElement("div");
      w.setAttribute("role", "dialog");
      w.style.cssText = "position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px";
      w.innerHTML = '<div style="background:var(--surface,#fff);color:var(--ink,#111);border-radius:20px;padding:18px;max-width:420px;width:100%;font-family:inherit">' +
        '<b style="display:block;font-size:16px;margin-bottom:6px">Datei ist fertig</b>' +
        '<div style="font-size:13.5px;margin-bottom:14px;word-break:break-all">' + file.name.replace(/[<&]/g, "") + '</div>' +
        '<div style="display:flex;gap:9px"><button data-a="go" style="flex:1;min-height:46px;border:none;border-radius:12px;background:var(--accent,#0B7A63);color:#fff;font-weight:700;font-size:15px">Teilen / Sichern</button>' +
        '<button data-a="no" style="min-height:46px;border-radius:12px;border:1px solid #ccc;background:none;color:inherit;padding:0 16px;font-size:15px">Abbrechen</button></div></div>';
      document.body.appendChild(w);
      w.querySelector('[data-a="no"]').onclick = () => { w.remove(); rej({ code: "declined" }); };
      w.querySelector('[data-a="go"]').onclick = async () => {
        try { await navigator.share({ files: [file], title: file.name }); w.remove(); res({ status: "saved" }); }
        catch(e){ w.remove(); rej({ code: e && e.name === "AbortError" ? "declined" : "unavailable" }); }
      };
    });
  }
  const user = { id: async () => "local", isOwner: () => true, canEdit: () => true, can: () => true };
  const caps = { db, user, assets, downloads };
  window.claude = { use: async name => caps[name] || null };

  /* Gerätespeicher möglichst vor dem automatischen Aufräumen des Browsers schützen. */
  try { if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e){}
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
