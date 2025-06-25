import { createSignal, For, onCleanup, onMount, Show, type Component } from 'solid-js';
import styles from './App.module.css';

import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'

const doc = new Y.Doc()
const wsProvider = new HocuspocusProvider({
  url: 'ws://yjs-test-aix2.vercel.app:1234',
  name: 'my-roomname',
  document: doc,
})

interface ChatMsg {
  time: number;
  author: string;
  content: string;
}

type State = "disconnected" | "leaved" | "joined";

const App: Component = () => {
  let nameInputRef: HTMLInputElement;
  let chatMsgInputRef: HTMLInputElement;


  const [myName, setMyName] = createSignal<string>("");
  const [names, setNames] = createSignal<string[]>([]);
  const [chat, setChat] = createSignal<ChatMsg[]>([]);
  const [serverCounter, setServerCounter] = createSignal<number>(0)

  let [state, setState] = createSignal<State>("leaved");

  wsProvider.on('status', (event: any) => {
    console.log(event.status) // logs "connected" or "disconnected"
    if (event.status !== "connected") {
      setState("disconnected")
    }
    if (event.status === "disconnected") {
      leave();
    }

  })

  const getUsersList = () => {
    const users = new Map<string, string>(doc.getMap("users"))
    return [...users.values().toArray()]
  }

  onMount(() => {
    doc.on("updateV2", () => {
      const users = new Map<string, string>(doc.getMap("users"))

      setMyName(users.get(doc.clientID.toString()) ?? "")
      setNames(getUsersList())

      const chat = doc.getArray<ChatMsg>("chat").toArray()
      setChat(chat ?? [])

      setServerCounter(Number(doc.getMap("server").get("counter")))
    })

    const users = new Map<string, string>(doc.getMap("users"))
    setMyName(users.get(doc.clientID.toString()) ?? "")
    setNames(getUsersList())
  })

  window.addEventListener("beforeunload", (e) => {
    e.preventDefault();
    if (state() === "joined") leave();
  })


  function join(name: string) {
    doc.getMap("users").set(doc.clientID.toString(), name)

    const update = Y.encodeStateAsUpdateV2(doc)
    Y.applyUpdateV2(doc, update)

    setState("joined");
  }

  function leave() {
    doc.getMap("users").delete(doc.clientID.toString())

    const update = Y.encodeStateAsUpdateV2(doc)
    Y.applyUpdateV2(doc, update)

    setState("leaved");
  }

  function sendChat(msg: string) {
    const chat = doc.getArray<ChatMsg>("chat")

    chat.push([{
      time: Date.now(),
      author: myName(),
      content: msg
    }])

    const update = Y.encodeStateAsUpdateV2(doc)
    Y.applyUpdateV2(doc, update)
  }

  return (
    <div class={styles.App}>
      <main>
        <div style={{ display: "flex", "flex-direction": "row", "justify-content": "center", gap: "24px", "margin-top": "24px" }}>
          <div style={{ display: "flex", "flex-direction": "column", width: "300px", gap: "4px" }}>
            <p>
              {serverCounter()}
            </p>

            <Show when={state() === "disconnected"}>
              <p>wow disconnected!</p>
            </Show>


            <Show when={state() === "leaved"}>
              <h1>join</h1>

              <input ref={(ref) => nameInputRef = ref} name="username" placeholder='your name'></input>

              <button onClick={() => {
                const inputName = nameInputRef.value
                if (!inputName || inputName === "") {
                  alert("invalid name");
                  return
                }
                if (getUsersList().includes(inputName)) {
                  alert("name already used");
                  return
                }

                join(inputName)
              }}>
                join
              </button>
            </Show>


            <Show when={state() === "joined"}>
              <h1>welcome, {myName()}</h1>
              <button onClick={() => {
                leave();
              }} >leave</button>

              <div style={{ display: "flex", "flex-direction": "column", "align-items": "start", }}>
                <p style={{ margin: 0, "margin-top": "16px" }}>connected users</p>
                <For each={names()}>
                  {(name) => {
                    return <p style={{ margin: 0, color: name === myName() ? "red" : "inherit" }}>{name}</p>
                  }}
                </For>
              </div>
            </Show>
          </div>

          <Show when={state() === "joined"}>
            <div style={{ position: "relative", display: "flex", "flex-direction": "column", "align-items": "start", width: "300px", gap: "4px", "background-color": "#00000030" }}>

              <p style={{ margin: 0, "margin-top": "16px" }}>chat</p>
              <For each={chat()}>
                {(msg) => {
                  const date = new Date(msg.time)
                  return <p style={{ margin: 0 }}>{String(date.getHours()).padStart(2, '0')}:{String(date.getMinutes()).padStart(2, '0')} {msg.author}: {msg.content}</p>
                }}
              </For>
              <div style={{ display: "flex", "flex-direction": "row" }}>
                <input ref={(ref) => chatMsgInputRef = ref} style={{ "flex-grow": 1 }} />
                <button type="button" onClick={() => {
                  const inputMsg = chatMsgInputRef.value
                  if (inputMsg && inputMsg !== "") sendChat(inputMsg);
                }} >send</button>
              </div>
            </div>
          </Show>
        </div>
      </main >

    </div >
  );
};

export default App;
