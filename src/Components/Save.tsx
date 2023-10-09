import { useState, useRef } from "react";
import { useSelector } from "react-redux"
import { SongState } from "../reducers";
import styles from "../Styles/App.module.scss";
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ifsfdjaensqwsrhoymfh.supabase.co'
const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlmc2ZkamFlbnNxd3NyaG95bWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY3NTUzOTcsImV4cCI6MjAxMjMzMTM5N30.pHYsuL39FQql2zs7tMoL9i5Vqod2Or07nPwB-XnKFww')


interface SaveProps {
    onClose: () => void;
  }

export default function Save({ onClose }: SaveProps) {
    const song = useSelector((state: { song: SongState }) => state.song)

    const saveRef = useRef<HTMLDivElement | null>(null);
    const [name, setName] = useState<string>('');

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        return user?.id
    }

    const save = async () => {
        if(name !== ''){
            let { data } = await supabase
            .from('songs')
            .select()
            .eq('user', await getUser())
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
                .insert([{data: song, name: name}])
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
            </div>

        </div>
    )
}