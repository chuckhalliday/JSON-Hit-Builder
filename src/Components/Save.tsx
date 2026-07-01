import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux"
import { SongState, setSong } from "../reducers";
import styles from "../Styles/App.module.scss";
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://daonzpcrzgamlmcnjoiv.supabase.co'
const supabase = createClient(supabaseUrl, 'sb_publishable_xYcgf8Ytdb36Y371k0v1uA_wfjbbGSJ')


interface SaveProps {
    onClose: () => void;
  }

export default function Save({ onClose }: SaveProps) {
    const song = useSelector((state: { song: SongState }) => state.song)

    const saveRef = useRef<HTMLDivElement | null>(null);
    const [name, setName] = useState<string>('');
    const [user, setUser] = useState<string | null>(null); // State to store user
    const [savedComps, setSavedComps] = useState<any[]>([]); // State to store saved components
  
    useEffect(() => {
      async function fetchData() {
        const userData = await getUser();
        setUser(userData);
        const songsData = await getSongs(userData);
        setSavedComps(songsData);
      }
  
      fetchData();
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
          if (saveRef.current && !saveRef.current.contains(e.target as Node)) {
            onClose();
          }
        }
          document.addEventListener("mousedown", handler);
  
          return () => {
            document.removeEventListener("mousedown", handler);
          };
        }, []);

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if(user) {
            return user.id
        } else {
            return null
        }
    }

    const getSongs = async (user: string | null) => {
        if (!user) {
          return [];
        }
    
        let { data: songs, error } = await supabase
          .from('songs')
          .select()
          .eq('user', user)
          console.log(songs)
        return songs || [];
      }

      const dispatch = useDispatch()

      const updateSong = (data: SongState) => {
        dispatch(setSong(data))
        onClose()
      }

    const save = async () => {
        if(name !== ''){
            let { data } = await supabase
            .from('songs')
            .select()
            .eq('user', user)
            .eq('name', name)
            console.log(data)
            if(data && data.length > 0){
                const { data, error } = await supabase
                .from('songs')
                .update([{data: song}])
                .eq('name', name)
                .select()
                alert(`${name} updated!`)
                onClose()
            } else {
                const { data, error } = await supabase
                .from('songs')
                .insert([{data: song, name: name, user: user}])
                .select()
                alert(`${name} created!`)
                onClose()
            }
        } else {
            alert('Please name the song')
        }
      }

    return (
        <div className={styles.generateContainer} ref={saveRef}>
          <button onClick={onClose}>x</button>
            <div>
                <h2>Save Your Song</h2>
                <form>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)} // Update the name state when input changes
          />
          <button type="button" onClick={save}>
            Save
          </button>
        </form>
            <div>
                <h2>Load Previous</h2>
            </div>
            <div>
          {savedComps.map((comp) => {
            return (
              <div key={comp.name}>
                <button onClick={() => updateSong(comp.data)}>{comp.name}</button>
              </div>
            )
          })}
        </div>
            </div>

        </div>
    )
}