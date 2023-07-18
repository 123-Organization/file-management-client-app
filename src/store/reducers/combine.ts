import { combineReducers } from 'redux';
import imageReducer from './index';

const reducers = combineReducers({
    images: imageReducer
});

export default reducers;
export type RootState = ReturnType<typeof reducers>;