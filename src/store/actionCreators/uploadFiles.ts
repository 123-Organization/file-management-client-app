import axios from 'axios';
import { Dispatch } from 'redux';
import { ActionType, Action } from '../actionTypes';

export const postUploadFiles = (postId: string) => {
    return async (dispatch: Dispatch<Action>) => {
        dispatch({
            type: ActionType.GET_POST_UPLOAD_IMAGE_PENDING
        });

        try {
            const { data } = await axios.get(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`);
            console.log(data);
            dispatch({
                type: ActionType.GET_POST_UPLOAD_IMAGE_SUCCESS,
                payload: data  
            });

        } catch(err) {
            dispatch({
                type: ActionType.GET_POST_UPLOAD_IMAGE_FAIL,
                payload: ''
            });
        }
    }
} 