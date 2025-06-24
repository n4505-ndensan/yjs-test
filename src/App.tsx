import { createSignal, For, onCleanup, onMount, Show, type Component } from 'solid-js';
import { reconcile } from 'solid-js/store'

import logo from './logo.svg';
import styles from './App.module.css';

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const doc = new Y.Doc()
const wsProvider = new WebsocketProvider('ws://localhost:1234', 'my-roomname', doc, {
  connect: true
})

type State = "leaved" | "joined";

const App: Component = () => {
  let inputRef: HTMLInputElement;
  const [myName, setMyName] = createSignal<string>("");
  const [names, setNames] = createSignal<string[]>([]);

  let [state, setState] = createSignal<State>("leaved");


  wsProvider.on('status', event => {
    console.log(event.status) // logs "connected" or "disconnected"
    if (event.status === "disconnected") leave();
  })

  onMount(() => {
    doc.getMap("users").observeDeep(() => {
      const users = new Map<string, string>(doc.getMap("users"))

      setMyName(users.get(doc.clientID.toString()) ?? "")
      setNames([...users.values().toArray()])
    })

    const users = new Map<string, string>(doc.getMap("users"))
    setMyName(users.get(doc.clientID.toString()) ?? "")
    setNames([...users.values().toArray()])
  })

  window.addEventListener("beforeunload", (e) => {
    e.preventDefault();
    if (state() !== "joined") return;
    leave();
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

  return (
    <div class={styles.App}>
      <main>

        <Show when={state() === "leaved"}>
          <input ref={(ref) => inputRef = ref} name="username" placeholder='your name'></input>

          <button onClick={() => {
            join(inputRef.value);
          }}>
            join
          </button>
        </Show>


        <Show when={state() === "joined"}>
          <h1>welcome, {myName()}</h1>
          <button onClick={() => {
            leave();
          }} >leave</button>

          <button onClick={async () => {
            doc.getMap("users").clear();
            const update = Y.encodeStateAsUpdateV2(doc)
            Y.applyUpdateV2(doc, update)

          }} >clear</button>
        </Show>
        <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
          <p style={{ margin: 0 }}>connected users</p>
          <For each={names()}>
            {(name) => {
              return <p style={{ margin: 0 }}>{name}</p>
            }}
          </For>
        </div>
      </main>

    </div>
  );
};

export default App;
