
import { ImageUpload } from '../reducers/index';

export enum ActionType {
    GET_POST_UPLOAD_IMAGE_PENDING = 'GET_POST_UPLOAD_IMAGE_PENDING',
    GET_POST_UPLOAD_IMAGE_SUCCESS = 'GET_POST_UPLOAD_IMAGE_SUCCESS',
    GET_POST_UPLOAD_IMAGE_FAIL = 'GET_POST_UPLOAD_IMAGE_FAIL'
}

interface actionPending {
    type: ActionType.GET_POST_UPLOAD_IMAGE_PENDING;
}

interface actionSuccess {
    type: ActionType.GET_POST_UPLOAD_IMAGE_SUCCESS;
    payload: ImageUpload[];
}

interface actionFail {
    type: ActionType.GET_POST_UPLOAD_IMAGE_FAIL;
    payload: string;
}

export type Action = actionPending | actionSuccess | actionFail;