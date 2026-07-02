import { configureStore } from '@reduxjs/toolkit'
import song from './reducers';

const store = configureStore({
    reducer: {
        song: song.reducer
    }
});

// Dispatch type that understands thunks (e.g. `newSong`), for typed useDispatch.
export type AppDispatch = typeof store.dispatch;

export default store;