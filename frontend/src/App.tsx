import { Sidebar } from "./components/Sidebar";
import { TodoList } from "./features/todos/TodoList";
import type { Todo } from "./features/todos/types";

// Stand-ins until the list comes from the API.
const sampleTodos: Todo[] = [
  {
    id: "3f1c2a8e-5b7d-4e0a-9c61-2d8b4f6a1e01",
    title: "Read the minimal API walkthrough",
    description: "Focus on route groups and TypedResults.",
    status: "Active",
  },
  {
    id: "8a4e6c20-1f3b-4d5e-b7a9-0c2d4e6f8a02",
    title: "Buy groceries",
    description: "Milk, bread, feijoas",
    status: "Active",
  },
  {
    id: "c7d9e1f3-2a4b-4c6d-8e0f-1a3b5c7d9e03",
    title: "Fix the leaking tap",
    description: null,
    status: "Completed",
  },
  {
    id: "1b3d5f7a-9c2e-4a6b-8d0f-3e5a7c9b1d04",
    title: "Book dentist",
    description: null,
    status: "Active",
  },
];

function App() {
  return (
    <div className="flex h-screen bg-stone-50 text-stone-800">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-stone-200 px-6 py-4">
          <h1 className="text-xl font-semibold">Todos</h1>
        </header>
        <TodoList todos={sampleTodos} />
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
