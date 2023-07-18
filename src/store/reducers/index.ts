import { Action, ActionType } from '../actionTypes/index';

export interface ImageUpload {
    title?: string,
    description?: string,
    image: File,
    libraryName: string,
    librarySessionId: string,
    libraryAccountKey: string,
    librarySiteId: string,
}

interface State {
    images: ImageUpload[];
    loading: boolean;
    error: string | null;
}

const initialState = {
    images: [],
    loading: false, 
    error: null 
}

const imageReducer = (state: State = initialState, action: Action):State => {
    switch(action.type) {
        case ActionType.GET_POST_UPLOAD_IMAGE_PENDING:
            return {
                loading: true,
                images: [],
                error: null  
            } 
        case ActionType.GET_POST_UPLOAD_IMAGE_SUCCESS:
            return {
                loading: false,
                images: action.payload,
                error: null 
            }
        case ActionType.GET_POST_UPLOAD_IMAGE_FAIL:
            return {
                loading: false,
                error: action.payload,
                images: []
            }
        default: 
            return state;
    }
}

export default imageReducer;