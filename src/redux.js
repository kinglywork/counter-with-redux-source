function createStore(reducer, initialState, enhancer) {
	if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
		enhancer = initialState;
		initialState = undefined;
	}

	if (typeof enhancer !== 'undefined') {
		return enhancer(createStore)(reducer, initialState);
	}

	const currentReducer = reducer;
	let currentState = initialState;
	let currentListeners = [];
	let nextListeners = currentListeners;
	let isDispatching = false;

	function ensureCanMutateNextListeners() {
		if (nextListeners === currentListeners) {
			nextListeners = currentListeners.slice();
		}
	}

	function getState() {
		return currentState;
	}

	function subscribe(listener) {
		let isSubscribed = true;

		ensureCanMutateNextListeners();
		nextListeners.push(listener);

		return function unsubscribe() {
			if (!isSubscribed) {
				return;
			}

			isSubscribed = false;

			ensureCanMutateNextListeners();
			const index = nextListeners.indexOf(listener);
			nextListeners.splice(index, 1);
		}
	}

	function dispatch(action) {
		try {
			isDispatching = true;
			currentState = currentReducer(currentState, action);
		} finally {
			isDispatching = false;
		}

		const listeners = currentListeners = nextListeners;
		for (let i = 0; i < listeners.length; i++) {
			listeners[i]();
		}

		return action;
	}

	dispatch({type: '@@redux/INIT'});

	return {
		dispatch,
		subscribe,
		getState
	};
}

function combineReducers(reducers) {
	const reducerKeys = Object.keys(reducers);
	const finalReducers = {};
	for (let i = 0; i < reducerKeys.length; i++) {
		const key = reducerKeys[i];
		if (typeof reducers[key] === 'function') {
			finalReducers[key] = reducers[key];
		}
	}
	const finalReducerKeys = Object.keys(finalReducers);

	return function combination(state = {}, action) {
		let hasChanged = false;
		const nextState = {};
		for (let i = 0; i < finalReducerKeys.length; i++) {
			const key = finalReducerKeys[i];
			const reducer = finalReducers[key];
			const previousStateForKey = state[key];
			const nextStateForKey = reducer(previousStateForKey, action);
			nextState[key] = nextStateForKey;
			hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
		}
		return hasChanged ? nextState : state;
	}
}

function compose(...funcs) {
	return (...args) => {
		if (funcs.length === 0) {
			return args[0]
		}

		const last = funcs[funcs.length - 1];
		const rest = funcs.slice(0, -1);

		return rest.reduceRight((composed, f) => f(composed), last(...args))
	}
}

function applyMiddleware(...middlewares) {
	return (createStore) => (reducer, initialState, enhancer) => {
		const store = createStore(reducer, initialState, enhancer);
		let dispatch = store.dispatch;
		let chain = [];

		const middlewareAPI = {
			getState: store.getState,
			dispatch: (action) => dispatch(action)
		};
		chain = middlewares.map(middleware => middleware(middlewareAPI));
		dispatch = compose(...chain)(store.dispatch);

		return {
			...store,
			dispatch
		};
	}
}

export {
	compose,
	applyMiddleware,
	combineReducers,
	createStore
};