import React from 'react';
import ReactDOM from 'react-dom';

import {createStore, combineReducers, applyMiddleware} from "./redux";

const counter = (state = 0, action) => {
	switch (action.type) {
		case "INCREMENT":
			return state + 1;
		case "DECREMENT":
			return state - 1;
		default:
			return state;
	}
};

const timer = (state = '', action) => {
	switch (action.type) {
		case "TIMER":
			const now = new Date();
			return now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
		default:
			return state;
	}
};

const Counter = ({
	                 value,
	                 onIncrement,
	                 onDecrement
                 }) => (
	<div>
		<h1>{value}</h1>
		<button onClick={onIncrement}>+</button>
		<button onClick={onDecrement}>-</button>
	</div>
);

const Panel = ({
	               time,
	               startTimer,
	               children
               }) => (
	<div>
		<h2>{time}</h2>
		<button onClick={startTimer}>start timer</button>
		{children}
	</div>
);

const logMiddleware = store => next => action => {
	const stateString = ({counter, timer}) => 'counter is ' + counter + ', timer is ' + timer;
	console.log('before dispatch: action is ' + action.type + ', ' + stateString(store.getState()));
	next(action);
	console.log('after dispatch: current action is ' + action.type + ', ' + stateString(store.getState()));
};

const limitMiddleware = store => next => action => {
	const {counter} = store.getState();
	const LIMIT = 3;
	if (counter >= LIMIT && action.type === "INCREMENT") {
		console.log('can not increment any more!');
		return;
	}
	if (counter <= -LIMIT && action.type === "DECREMENT") {
		console.log('can not decrement any more!');
		return
	}
	next(action);
};

const thunkMiddleware = store => next => action => {
	if (typeof action === 'function') {
		action(store.dispatch, store.getState);
	} else {
		next(action);
	}
};

const createFinalStore = applyMiddleware(
	thunkMiddleware,
	limitMiddleware,
	logMiddleware
);

const app = combineReducers({counter, timer});
const store = createFinalStore(createStore)(app);

const App = ({store}) => (
	<Panel
		time={store.getState().timer}
		startTimer={() => {
			store.dispatch((dispatch, getState) => setInterval(() => dispatch({type: 'TIMER'}), 1000))
		}}
	>
		<Counter
			value={store.getState().counter}
			onIncrement={() =>
				store.dispatch({type: 'INCREMENT'})
			}
			onDecrement={() =>
				store.dispatch({type: 'DECREMENT'})
			}
		/>
	</Panel>
);

const render = () => {
	ReactDOM.render(<App store={store}/>, document.getElementById('root'));
};

store.subscribe(render);
render();
