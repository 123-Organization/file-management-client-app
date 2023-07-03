import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';





import { useDispatch } from 'react-redux';
import { useTypedSelector } from './hooks /useTypeSelector';
import { getComments } from './store/actionCreators/getComment';




function App() {
  const dispatch = useDispatch();
  const [postId, setPostID] = useState("");
  const { comments, loading, error } = useTypedSelector((state) => state.comments);

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await dispatch(getComments(postId) as any);
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <h1 className="text-3xl font-bold underline text-green-600">
          Simple React Typescript Tailwind Sample
        </h1>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
