/** Personal reference recordings live only in this browser's IndexedDB. */
const DATABASE = "client-side-speech-ai-voices";
const STORE = "voices";

export type VoiceProfile = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Local voice storage is not supported by this browser."));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local voice storage."));
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore, resolve: (result: T) => void, reject: (reason: Error) => void) => void
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error("Voice storage transaction failed.")); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error("Voice storage transaction aborted.")); };
    callback(tx.objectStore(STORE), resolve, reject);
  });
}

export async function listVoiceProfiles(): Promise<VoiceProfile[]> {
  return transaction("readonly", (store, resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as VoiceProfile[]);
    req.onerror = () => reject(req.error ?? new Error("Could not list saved voices."));
  });
}

export async function saveVoiceProfile(name: string, file: File): Promise<VoiceProfile> {
  const profile: VoiceProfile = {
    id: crypto.randomUUID(), name: name.trim().slice(0, 80),
    fileName: file.name, mimeType: file.type, blob: file,
  };
  if (!profile.name) throw new Error("Enter a voice profile name.");
  return transaction("readwrite", (store, resolve, reject) => {
    const req = store.put(profile);
    req.onsuccess = () => resolve(profile);
    req.onerror = () => reject(req.error ?? new Error("Could not save reference audio."));
  });
}

export async function deleteVoiceProfile(id: string): Promise<void> {
  return transaction("readwrite", (store, resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("Could not delete voice."));
  });
}

export function profileToFile(profile: VoiceProfile): File {
  return new File([profile.blob], profile.fileName, { type: profile.mimeType });
}
