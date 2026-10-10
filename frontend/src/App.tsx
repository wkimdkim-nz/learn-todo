import { Sidebar } from "./components/Sidebar";
import { TodoList } from "./features/todos/TodoList";

function App() {
  return (
    <div className="flex h-screen bg-stone-50 text-stone-800">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-stone-200 px-6 py-4">
          <h1 className="text-xl font-semibold">Todos</h1>
        </header>
        <TodoList />
      </main>

      <section className="w-96 shrink-0 border-l border-stone-200 bg-white p-6">
        <p className="mt-24 text-center text-sm text-stone-500">
          Select a Todo to see and edit it.
        </p>
      </section>
    </div>
  );
}

export default App;
