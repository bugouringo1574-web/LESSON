import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, deleteDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const $ = (id) => document.getElementById(id);
const views = { login: $("loginView"), room: $("roomView"), main: $("appView") };
const show = (name) => Object.entries(views).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));

let user = null;
let roomId = localStorage.getItem("roomId") || "";
let unsub = null;
let tasks = [];
let filter = "todo";

/* ---------- 認証 ---------- */
$("googleBtn").onclick = () => signInWithPopup(auth, new GoogleAuthProvider()).catch(alertErr);
$("outBtn").onclick    = () => signOut(auth);
$("leaveBtn").onclick  = () => { localStorage.removeItem("roomId"); roomId = ""; route(); };

onAuthStateChanged(auth, (u) => {
  user = u;
  $("who").textContent = u ? (u.displayName || u.email || "") : "";
  route();
});

function route() {
  if (unsub) { unsub(); unsub = null; }
  if (!user) return show("login");
  if (!roomId) { $("roomInput").value = ""; return show("room"); }
  $("roomLabel").textContent = "おうちコード：" + roomId;
  show("main");
  listen();
}

$("roomBtn").onclick = () => {
  const v = $("roomInput").value.trim().toLowerCase().replace(/\s+/g, "-");
  if (!v) return;
  roomId = v;
  localStorage.setItem("roomId", roomId);
  route();
};

/* ---------- データ ---------- */
const tasksRef = () => collection(db, "rooms", roomId, "tasks");

function listen() {
  unsub = onSnapshot(
    query(tasksRef(), orderBy("createdAt", "desc")),
    (snap) => { tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() })); render(); },
    alertErr
  );
}

$("addForm").onsubmit = async (e) => {
  e.preventDefault();
  const title = $("titleInput").value.trim();
  if (!title) return;
  try {
    await addDoc(tasksRef(), {
      title,
      due: $("dueInput").value || "",
      forWhom: $("forInput").value,
      done: false,
      createdBy: user.displayName || user.email || "",
      createdAt: serverTimestamp()
    });
    $("addForm").reset();
  } catch (err) { alertErr(err); }
};

const toggle = (t) => updateDoc(doc(db, "rooms", roomId, "tasks", t.id), {
  done: !t.done,
  doneAt: !t.done ? serverTimestamp() : null
}).catch(alertErr);

const remove = (t) => {
  if (confirm("このタスクを削除しますか？")) {
    deleteDoc(doc(db, "rooms", roomId, "tasks", t.id)).catch(alertErr);
  }
};

/* ---------- 表示 ---------- */
document.querySelectorAll(".tab").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    filter = btn.dataset.filter;
    render();
  };
});

const today = () => new Date().toISOString().slice(0, 10);
const label = (w) => (w === "mom" ? "お母さん" : "じぶん");

function render() {
  const list = $("list");
  list.textContent = "";
  const shown = tasks.filter((t) => filter === "all" || (filter === "done" ? t.done : !t.done));

  const remain = tasks.filter((t) => !t.done).length;
  $("summary").textContent = `のこり ${remain}件 ／ おわった ${tasks.length - remain}件`;
  $("empty").classList.toggle("hidden", shown.length > 0);

  for (const t of shown) {
    const li = document.createElement("li");
    li.className = "item" + (t.done ? " done" : "");

    const chk = document.createElement("button");
    chk.className = "check";
    chk.textContent = t.done ? "✓" : "";
    chk.onclick = () => toggle(t);

    const body = document.createElement("div");
    body.className = "body";
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = t.title;
    const meta = document.createElement("div");
    meta.className = "meta";

    const who = document.createElement("span");
    who.className = "badge";
    who.textContent = label(t.forWhom);
    meta.appendChild(who);

    if (t.due) {
      const due = document.createElement("span");
      const late = !t.done && t.due < today();
      due.className = "badge" + (late ? " late" : "");
      due.textContent = (late ? "期限すぎ " : "期限 ") + t.due;
      meta.appendChild(due);
    }
    if (t.createdBy) {
      const by = document.createElement("span");
      by.textContent = "by " + t.createdBy;
      meta.appendChild(by);
    }

    body.append(title, meta);

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.onclick = () => remove(t);

    li.append(chk, body, del);
    list.appendChild(li);
  }
}

function alertErr(err) {
  console.error(err);
  alert("エラー: " + (err?.message || err));
}
