import React, { useState, useEffect, useCallback } from 'react'
import Info from './Info';
import Generate from './Generate';
import Save from './Save';
import Sounds from './Sounds';
import SectionPanel from './SectionPanel';
import SectionTypeMenu from './SectionTypeMenu';
import LyricsSheet from './LyricsSheet';
import Transport, { SoundSource, Track, swingMetronome } from './Transport';
import { SHORT_LABELS } from '../Core/form';
import { downloadMidi } from '../Core/exportMidi';
import { PaletteInput, SoundPick } from '../Core/timbre';
import { SectionLabel } from '../Core/doc';
import { melodyFor } from '../Core/melody';
import DrumMachine, { StepTracker } from "./DrumMachine";
import SectionToggle, { SectionCaption } from './SectionToggle';
import FitBox from './FitBox';
import { PHONE_QUERY, useMediaQuery } from './useMediaQuery';
import { partLyrics, placeLyrics } from '../Core/lyrics';
import BassStaff from "./BassStaff";
import Piano, { PlayHandle } from './Piano';
import { useSelector, useDispatch } from "react-redux"
import { playVerse } from '../Playback/playSong';
import { countIn } from '../Playback/metronome';
import { getAudioContext } from '../Playback/audioContext';
import { turnTo, useLampStep } from '../Playback/useLampStep';
import { barFit } from './barFit';
import { incrementByAmount, setIsPlaying, setMidi, setAcoustic, SongState, setCurrentBeat, newSong, reorderParts, loadSong, setLoopPick, toggleLoop, setPartLinked, setPartSection, duplicatePart, deletePart, setSounds, undo } from '../reducers';
import { isDetached, linkedCount } from '../Core/generate';
import { beatsInPart, clampRegion, containsPoint, describePoint, partWindow, stepBeat, sum, trackWindow } from '../Playback/loop';
import type { AppDispatch } from '../store'
import styles from "../Styles/App.module.scss"
import { supabase } from '../supabaseClient'

// User ids allowed to see internal-only features (the T1-T10 song-generation
// tabs and the Advanced generation settings): the dev-login account and the
// one Google account used for testing.
const DEV_USER_ID = '073e2300-29ac-429d-af14-f1b34b44802a';
const TEST_GOOGLE_USER_ID = '92fcd2d4-cc80-4d8e-8246-7f645800492c';
const SONG_TAB_COUNT = 10;

// The collapsible sections of an open part, between the bar/lamp strip and
// the transport.
type PartSection = 'section' | 'words' | 'bass' | 'drums';
const NONE_COLLAPSED: Record<PartSection, boolean> = { section: false, words: false, bass: false, drums: false };

function listInputsAndOutputs(midiAccess: WebMidi.MIDIAccess) {
  console.log("MIDI ready!");
  for (const entry of midiAccess.inputs) {
    const input = entry[1];
    console.log(
      `Input port: name:'${input.name}'`
    );
  }

  for (const entry of midiAccess.outputs) {
    const output = entry[1];
    console.log(
      `Output port: name:'${output.name}'`,
    );
  }
}

// A preview's ref: out of reach of the mouse, keyboard and screen readers.
// (Set by hand: React 18 doesn't know the attribute.)
const inert = (el: HTMLElement | null) => el?.setAttribute('inert', '');

function onMIDIFailure(msg: string) {
  console.error(`Failed to get MIDI access - ${msg}`);
}


function App() {
  const [openedParts, setOpenedParts] = useState<{ [key: string]: boolean }>({});
  const [currentPart, setCurrentPart] = useState<number>(0); // Track current open part
  const [draggedPartIndex, setDraggedPartIndex] = useState<number | null>(null);
  const [dragOverPartIndex, setDragOverPartIndex] = useState<number | null>(null);
  const [showInfoScreen, setShowInfoScreen] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saveScreen, setSaveScreen] = useState(false);
  const [soundsScreen, setSoundsScreen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  // Which sections are collapsed (wider screens). Everything starts open
  // when the app loads; from then on what's closed stays closed from part
  // to part, since this is one setting for every part, not one per part.
  const [collapsed, setCollapsed] = useState<Record<PartSection, boolean>>(NONE_COLLAPSED);
  const toggleSection = (section: PartSection) => setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  // Phones show one section at a time, as tabs, starting each visit on the
  // drum machine; the open section fills the height left under the tabs,
  // measured here for the staff canvas to fit itself to.
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [phoneSection, setPhoneSection] = useState<PartSection>('drums');
  const [sectionBodyHeight, setSectionBodyHeight] = useState(0);
  const sectionBodyObserver = React.useRef<ResizeObserver | null>(null);
  const sectionBodyRef = useCallback((el: HTMLDivElement | null) => {
    sectionBodyObserver.current?.disconnect();
    sectionBodyObserver.current = null;
    if (!el) return;
    const observer = new ResizeObserver(() => setSectionBodyHeight(el.clientHeight));
    observer.observe(el);
    sectionBodyObserver.current = observer;
  }, []);
  const anyPartOpen = Object.values(openedParts).some(Boolean);

  // T1-T10 song-generation slots. Only the active tab's song lives in Redux;
  // the other nine are parked here and swapped back in via loadSong() so each
  // tab keeps its own independent structure, edits, and playback position.
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [tabSongs, setTabSongs] = useState<Array<SongState | null>>(() => new Array(SONG_TAB_COUNT).fill(null));
  const isPrivilegedUser = userId === DEV_USER_ID || userId === TEST_GOOGLE_USER_ID;
  const canUseSongTabs = isPrivilegedUser;

  const login = async () => {
    if (!authenticated) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const devLogin = async () => {
    const email = import.meta.env.VITE_DEV_EMAIL;
    const password = import.meta.env.VITE_DEV_PASSWORD;
    if (!email || !password) {
      alert('Set VITE_DEV_EMAIL and VITE_DEV_PASSWORD in .env.local to use dev login.');
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Dev login failed: ${error.message}`);
      return;
    }
    setAuthenticated(true);
    setUserId(data.user?.id ?? null);
  };

  // Create the shared AudioContext at mount, not lazily inside the first
  // Play. Autoplay policy keeps it suspended (clock frozen at 0) until the
  // first user-gesture resume, which protects the opening notes: a context
  // created mid-gesture instead reports "running" while its output stream is
  // still opening, and the clock burst-advances past anything just scheduled
  // (heard as several silent measures before sound starts on Linux).
  useEffect(() => {
    getAudioContext();
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        alert(`Failed to check login status: ${error.message}`);
        return;
      }
      if (session) {
        setAuthenticated(true);
        setUserId(session.user.id);
      }
    };

    checkAuthentication();
  }, []);


  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      alert(`Logout failed: ${error.message}`);
      return;
    }
    setAuthenticated(false)
    setUserId(null)
    setCurrentTabIndex(0)
    setTabSongs(new Array(SONG_TAB_COUNT).fill(null))
  }

  const handleGenerateClick = () => {
    setShowGenerate(true);
  };

  const handleCloseGenerate = () => {
    setShowGenerate(false);
  };

  const handleSaveClick = () => {
    setSaveScreen(true);
  };

  const handleCloseSave = () => {
    setSaveScreen(false);
  };

  const song = useSelector((state: { song: SongState }) => state.song)
  const bpm = song.bpm
  const isPlaying = song.isPlaying
  const midi = song.midi
  const acoustic = song.acoustic
  let verse = song.selectedBeat[0]
  let drumBeat = song.selectedBeat[1];
  let bassBeat = song.selectedBeat[2]
  let chordBeat = song.selectedBeat[3]

  const lampsRef = React.useRef<HTMLInputElement[]>([]);
  const stopRef = React.useRef(false);
  // Bumped whenever the user manually picks a lamp position. Lets an in-flight
  // pause (see stop-branch below) detect that its paused position is stale and
  // avoid clobbering the newer manual selection.
  const manualSeekEpochRef = React.useRef(0);
  // Song playback chains parts gaplessly: each part hands off slightly before
  // it ends, leaving the audio-clock time the next part must start at here.
  const nextStartRef = React.useRef<number | undefined>(undefined);
  // The part whose lamps playback may light. A part's last few step timers
  // fire after the next part is already on screen; they must not light lamps
  // in the new part's grid.
  const activeVerseRef = React.useRef(-1);
  // Where the next segment enters ([part, drum, bass, chord] indices) when
  // playback moves on by itself - the next part, or back to the loop start.
  // Passed by ref (not read back from the store) because the previous
  // segment's last step timers may still be updating the store position.
  const nextEntryRef = React.useRef<number[] | undefined>(undefined);
  // The newest song state, for decisions made after an await.
  const songRef = React.useRef(song);
  songRef.current = song;
  // Bumped to re-run the playback effect when a loop wraps within one part
  // (the part index doesn't change, so it alone wouldn't trigger it).
  const [playTick, setPlayTick] = useState(0);

  const partGrooves = song.songStructure[verse] ?? { drumGroove: [], bassGroove: [], chordsGroove: [] };
  const handleStep = useLampStep(lampsRef, verse, partGrooves.drumGroove, partGrooves.bassGroove, partGrooves.chordsGroove);

  const pianoRef = React.useRef<PlayHandle>(null);
  const bassStaffRef = React.useRef<PlayHandle>(null);
  const drumMachineRef = React.useRef<PlayHandle>(null);
  const [includeChords, setIncludeChords] = useState(true);
  const [includeBass, setIncludeBass] = useState(true);
  const [includeDrums, setIncludeDrums] = useState(true);
  const [includeMelody, setIncludeMelody] = useState(true);
  // Drums muted from their titles in the drum grid, by voice. Playback asks
  // the ref hit by hit, so a mute takes effect during the part being played.
  const [mutedDrums, setMutedDrums] = useState<boolean[]>([]);
  const mutedDrumsRef = React.useRef(mutedDrums);
  mutedDrumsRef.current = mutedDrums;
  const toggleDrumMute = useCallback((voice: number) => {
    setMutedDrums(prev => {
      const next = [...prev];
      next[voice] = !next[voice];
      return next;
    });
  }, []);
  // The metronome: a bar of count-in when playback starts (countInRef arms
  // it), then a click on every beat. Playback asks the ref click by click,
  // so it can be switched on or off mid-song.
  const [metronome, setMetronome] = useState(false);
  const metronomeRef = React.useRef(metronome);
  metronomeRef.current = metronome;
  const countInRef = React.useRef(false);
  const metronomeButtonRef = React.useRef<HTMLButtonElement>(null);
  // Realism: the tracks played with a band's small unevenness in timing and
  // dynamics instead of exactly on the grid (realism.ts). Asked note by
  // note, like the metronome, so it can be switched mid-song.
  const [realism, setRealism] = useState(false);
  const realismRef = React.useRef(realism);
  realismRef.current = realism;
  // Lifted above BassStaff (rather than local state there) because each part's
  // BassStaff only mounts while its part is open - a local toggle would reset
  // to "staff" every time the user switched parts.
  const [bassViewMode, setBassViewMode] = useState<'staff' | 'tab'>('staff');

  const dispatch = useDispatch<AppDispatch>()

  // Generate the initial song on mount. Replaces the old import-time generation
  // so startup is an explicit, dispatchable (and seedable) action.
  useEffect(() => {
    dispatch(newSong());
  }, []);


  async function playSong(song: SongState, verse: number, drumBeat: number, bassBeat: number, chordBeat: number) {
    const seekEpochAtStart = manualSeekEpochRef.current;
    let startAt = nextStartRef.current;
    nextStartRef.current = undefined;
    const swing = (beat: number) => swingMetronome(metronomeButtonRef.current, beat, song.bpm);
    // Starting with the metronome on: a bar of clicks first, and the music
    // comes in where that bar ends.
    if (countInRef.current) {
      countInRef.current = false;
      startAt = await countIn(song.bpm, swing, () => stopRef.current);
    }
    activeVerseRef.current = verse;
    const step = (lampIndex: number) => {
      if (activeVerseRef.current === verse) handleStep(lampIndex);
    };
    let tempo = song.bpm - 60;
    //const output = new midi.Output()
    //output.openPort(3)

    //Start recording

    //output.sendMessage([144, 16, 1])
    //output.sendMessage([176, 50, tempo]);
      //Drop locators
      //output.sendMessage([144, 17, 1])
      //output.sendMessage([176, sum, 1])
      // Play the part from the playhead to the end of its loop window (the
      // whole part when no loop bounds it). Every track is cut at the drum
      // playhead's beat, so they stay aligned even when resuming mid-note.
      const part = song.songStructure[verse];
      const loop = song.loopEnabled ? clampRegion(song.loop, song.songStructure) : null;
      const partBeats = sum(part.drumGroove);
      const fromBeat = sum(part.drumGroove.slice(0, drumBeat));
      // Stop at the loop's end bar if this pass reaches it.
      const loopEndBeat = (region: typeof loop) => region && region.end.part === verse ? partWindow(region, verse, part).toBeat : null;
      const cycleAt = loopEndBeat(loop);
      const toBeat = cycleAt !== null && fromBeat < cycleAt - 0.01 ? cycleAt : partBeats;
      const melodyNotes = melodyFor(song.doc, song.songStructure, verse)?.notes;
      const windowed = {
        drum: trackWindow(part.drumGroove, fromBeat, toBeat),
        bass: trackWindow(part.bassGroove, fromBeat, toBeat),
        chord: trackWindow(part.chordsGroove, fromBeat, toBeat),
      };
      const result = await playVerse(
        song.bpm,
        song.midi,
        windowed.drum.start,
        windowed.bass.start,
        windowed.chord.start,
        windowed.drum.groove,
        part.drums,
        windowed.bass.groove,
        part.bassNoteLocations,
        windowed.chord.groove,
        part.chords,
        part.chordTones,
        step,
        () => stopRef.current,
        includeDrums,
        includeBass,
        includeChords,
        acoustic,
        song.key,
        startAt,
        { drum: windowed.drum.end, bass: windowed.bass.end, chord: windowed.chord.end },
        melodyNotes ? { notes: melodyNotes, from: fromBeat, to: toBeat } : undefined,
        includeMelody,
        voice => !!mutedDrumsRef.current[voice],
        { from: fromBeat, to: toBeat, on: () => metronomeRef.current, onClick: swing },
        () => realismRef.current,
      );

      if (stopRef.current) {
        // If the user picked a new lamp position, or switched song tabs,
        // while this stop was still in flight, their action is newer than
        // where we stopped - don't overwrite the (possibly now-different
        // tab's) state with this stale paused position.
        if (manualSeekEpochRef.current === seekEpochAtStart) {
          const wrap = (idx: number, len: number) => (idx >= len ? 0 : idx);
          const drumLen = song.songStructure[verse].drumGroove.length;
          const bassLen = song.songStructure[verse].bassGroove.length;
          const chordLen = song.songStructure[verse].chordsGroove.length;
          dispatch(setCurrentBeat([
            verse,
            wrap(result.drumBeat, drumLen),
            wrap(result.bassBeat, bassLen),
            wrap(result.chordBeat, chordLen),
          ]))
          dispatch(setIsPlaying({ isPlaying: false }))
        }
        return;
      }

      // What comes next is decided from the loop as it is now (it may have
      // been moved or switched off during this pass): back to the loop start
      // if this pass ended on its end bar, on through the rest of this part
      // if the loop was switched off, or on to the next part.
      const latest = songRef.current;
      const loopNow = latest.loopEnabled ? clampRegion(latest.loop, latest.songStructure) : null;
      const wrapAt = loopEndBeat(loopNow);
      let entry: number[] | null = null;
      if (loopNow && wrapAt !== null && Math.abs(toBeat - wrapAt) < 0.01) {
        const start = partWindow(loopNow, loopNow.start.part, latest.songStructure[loopNow.start.part]);
        entry = [loopNow.start.part, start.drum.start, start.bass.start, start.chord.start];
      } else if (toBeat < partBeats - 0.01) {
        const rest = (groove: number[]) => trackWindow(groove, toBeat, partBeats).start;
        entry = [verse, rest(part.drumGroove), rest(part.bassGroove), rest(part.chordsGroove)];
      } else if (verse + 1 < latest.songStructure.length) {
        entry = [verse + 1, 0, 0, 0];
      }
      const nextVerse = entry ? entry[0] : -1;
      if (entry) {
        // Resolved just before this segment ends: the next one starts
        // exactly where it finishes.
        nextStartRef.current = result.endTime;
        nextEntryRef.current = entry;
        dispatch(setCurrentBeat(entry))
        if (nextVerse !== verse) {
          activeVerseRef.current = nextVerse;
          showPart(nextVerse);
        }
        setPlayTick(t => t + 1);
      } else {
      dispatch(setIsPlaying({ isPlaying: false }))
      console.log("End")
      }
    // Stop recording
    //output.sendMessage([144, 16, 1])
  }

  const handlePartOpen = (key: string) => {
    const updatedOpenedParts: { [key: string]: boolean } = {};

    updatedOpenedParts[key] = !openedParts[key];

    for (const partKey in openedParts) {
      if (partKey !== key) {
        updatedOpenedParts[partKey] = false;
      }
    }

    setOpenedParts(updatedOpenedParts);
    
    if (updatedOpenedParts[key]) {
      setCurrentPart(parseInt(key));
    } else {
      setCurrentPart(-1);
    }
  };

  // Open a part (without the toggle-closed behaviour of handlePartOpen).
  const showPart = (index: number) => {
    setOpenedParts({ [`${index}`]: true });
    setCurrentPart(index);
  };

  const handlePartDragStart = (index: number) => {
    setDraggedPartIndex(index);
  };

  const handlePartDragOver = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault();
    if (draggedPartIndex !== null && draggedPartIndex !== index) {
      setDragOverPartIndex(index);
    }
  };

  const handlePartDrop = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault();
    if (draggedPartIndex !== null && draggedPartIndex !== index) {
      dispatch(reorderParts({ from: draggedPartIndex, to: index }));
      // Index-to-part associations are now stale, so close whatever was open.
      setOpenedParts({});
      setCurrentPart(-1);
    }
    setDraggedPartIndex(null);
    setDragOverPartIndex(null);
  };

  const handlePartDragEnd = () => {
    setDraggedPartIndex(null);
    setDragOverPartIndex(null);
  };

  const [renderWidth, setRenderWidth] = useState(0);

  // Publish the footer's live height (it wraps on narrow windows and grows
  // with the song tabs) so the opened part can fill the space above it.
  const footerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const publish = () => document.documentElement.style.setProperty('--footer-height', `${footer.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(footer);
    return () => observer.disconnect();
  }, [authenticated]);

  // Stable identity so StepTracker's width-measuring effect (which lists this in
  // its deps) doesn't re-run on every App render. The prev-guard also stops a
  // feedback loop where measuring width triggers a re-render that re-measures.
  const handleRenderWidthChange = useCallback((width: number) => {
    setRenderWidth(prev => (prev === width ? prev : width));
  }, []);
  // The next part's preview, shown to the right of the open part during
  // playback: its width, and its lamps (kept apart from the playhead's).
  const [previewWidth, setPreviewWidth] = useState(0);
  const previewLampsRef = React.useRef<HTMLInputElement[]>([]);

  // Phones fit each bar to the screen while playing (barFit): one bar takes
  // the open part's width, less its left padding (where a bar's first step
  // sits once turned to).
  const [barWidth, setBarWidth] = useState(0);
  const partViewObserver = React.useRef<ResizeObserver | null>(null);
  const partViewRef = useCallback((el: HTMLDivElement | null) => {
    partViewObserver.current?.disconnect();
    partViewObserver.current = null;
    if (!el) return;
    const observer = new ResizeObserver(() => setBarWidth(el.clientWidth - (parseFloat(getComputedStyle(el).paddingLeft) || 0)));
    observer.observe(el);
    partViewObserver.current = observer;
  }, []);
  const fitOf = (part: number) =>
    isPhone && isPlaying && barWidth > 0 && song.songStructure[part] ? barFit(song.songStructure[part].drumGroove, barWidth) : undefined;
  // Fitting moves every bar, so turn to the playhead's bar whenever the fit
  // comes or goes (playback starting or stopping) or a part opens with it.
  const openFit = fitOf(currentPart);
  const wasFitted = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!openFit && !wasFitted.current) return;
    wasFitted.current = !!openFit;
    const groove = song.songStructure[currentPart]?.drumGroove;
    if (!groove) return;
    const [atPart, atStep] = song.selectedBeat;
    turnTo(lampsRef.current, groove, atPart === currentPart ? atStep : 0);
  }, [openFit, currentPart]);

  useEffect(() => {
     if (isPlaying) {
      const entry = nextEntryRef.current;
      nextEntryRef.current = undefined;
      if (entry) {
        playSong(song, entry[0], entry[1], entry[2], entry[3]);
      } else {
        playSong(song, verse, drumBeat, bassBeat, chordBeat);
      }
    }
    // Not keyed on the part index: moving on to the next part (or back to a
    // loop start) bumps playTick, and the store update that moves the part
    // can render separately from it - keying on both started a second,
    // overlapping playback each time the song crossed into another part.
  }, [isPlaying, playTick]);


 // Switches to song tab `index`, saving the outgoing tab's full state (so its
 // edits and playback position survive) and either restoring the incoming
 // tab's previously-saved state or generating a fresh song for it.
 const handleTabSwitch = (index: number) => {
    if (index === currentTabIndex) return;

    // Signal any in-flight playback to stop scheduling, and invalidate its
    // stale-write guard so it can't clobber the tab we're switching to.
    stopRef.current = true;
    manualSeekEpochRef.current++;
    dispatch(setIsPlaying({ isPlaying: false }));

    setTabSongs(prev => {
      const next = [...prev];
      next[currentTabIndex] = { ...song, isPlaying: false };
      return next;
    });

    const incoming = tabSongs[index];
    if (incoming) {
      dispatch(loadSong(incoming));
    } else {
      dispatch(newSong());
      dispatch(setCurrentBeat([0, 0, 0, 0]));
    }

    setCurrentTabIndex(index);
    setOpenedParts({});
    setCurrentPart(-1);
  };

 // Menu of the open part's block: duplicate it into the next slot, delete
 // it, or close it. Positioned against the window, since the parts row
 // clips anything that overflows it.
 const [partMenu, setPartMenu] = useState<{ index: number, left: number, top: number } | null>(null);
 const partMenuRef = React.useRef<HTMLDivElement>(null);
 useEffect(() => {
   if (!partMenu) return;
   const onDown = (e: MouseEvent) => {
     const target = e.target as HTMLElement;
     if (partMenuRef.current?.contains(target) || target.closest('[aria-haspopup="menu"]')) return;
     setPartMenu(null);
   };
   const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPartMenu(null); };
   document.addEventListener('mousedown', onDown);
   window.addEventListener('keydown', onKey);
   return () => {
     document.removeEventListener('mousedown', onDown);
     window.removeEventListener('keydown', onKey);
   };
 }, [partMenu]);

 // Structure edits stop playback first - the running chain is indexed by part.
 const stopForEdit = () => {
   if (isPlaying) {
     stopRef.current = true;
     manualSeekEpochRef.current++;
     dispatch(setIsPlaying({ isPlaying: false }));
   }
 };

 // Undo the last song change (button at the far right of the parts row, or
 // Ctrl/Cmd+Z outside text fields).
 const past = song.past ?? [];
 const handleUndo = () => {
   if (past.length === 0) return;
   stopForEdit();
   setPartMenu(null);
   dispatch(undo());
   // A part that no longer exists can't stay open.
   const length = past[past.length - 1].songStructure.length;
   if (currentPart >= length) {
     setOpenedParts({});
     setCurrentPart(-1);
   }
 };
 const handleUndoRef = React.useRef(handleUndo);
 handleUndoRef.current = handleUndo;
 useEffect(() => {
   const onKey = (e: KeyboardEvent) => {
     // Leave Ctrl/Cmd+Z to text fields (their own text undo); checkboxes,
     // lamps and sliders keep it for the song.
     const target = e.target as HTMLElement;
     const typing = target instanceof HTMLInputElement
       ? !['checkbox', 'radio', 'range', 'button'].includes(target.type)
       : !!target.closest('textarea, select, [contenteditable="true"]');
     if (typing) return;
     if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
       e.preventDefault();
       handleUndoRef.current();
     }
   };
   window.addEventListener('keydown', onKey);
   return () => window.removeEventListener('keydown', onKey);
 }, []);

 const handleDuplicatePart = (index: number) => {
   stopForEdit();
   setPartMenu(null);
   dispatch(duplicatePart(index));
   showPart(index + 1);
 };

 // The open part's title opens a menu to make it another kind of section.
 const [sectionTypeMenuOpen, setSectionTypeMenuOpen] = useState(false);
 const partTitleRef = React.useRef<HTMLButtonElement>(null);
 const closeSectionTypeMenu = useCallback(() => setSectionTypeMenuOpen(false), []);
 useEffect(() => setSectionTypeMenuOpen(false), [currentPart]);
 const handleChangePartSection = (index: number, label: SectionLabel) => {
   stopForEdit();
   setPartMenu(null);
   dispatch(setPartSection({ part: index, label }));
 };

 const handleDeletePart = (index: number) => {
   stopForEdit();
   setPartMenu(null);
   dispatch(deletePart(index));
   showPart(Math.max(0, Math.min(index, song.songStructure.length - 2)));
 };

 const handleStartClick = () => {
    if (isPlaying) {
      stopRef.current = true;
      dispatch(setIsPlaying({isPlaying: false}));
    } else {
      stopRef.current = false;
      nextStartRef.current = undefined;
      nextEntryRef.current = undefined;
      countInRef.current = metronome;
      // With the loop on and the playhead outside it, start at the loop.
      // Judged from the stored playhead - where playback actually resumes -
      // not from whichever part happens to be open.
      const loop = song.loopEnabled ? clampRegion(song.loop, song.songStructure) : null;
      const [resumePart, resumeStep] = song.selectedBeat;
      const resumeGroove = song.songStructure[resumePart]?.drumGroove;
      const here = resumeGroove ? { part: resumePart, beat: stepBeat(resumeGroove, resumeStep) } : null;
      if (loop && (!here || !containsPoint(loop, here))) {
        const bounds = partWindow(loop, loop.start.part, song.songStructure[loop.start.part]);
        const entry = [loop.start.part, bounds.drum.start, bounds.bass.start, bounds.chord.start];
        nextEntryRef.current = entry;
        dispatch(setCurrentBeat(entry));
        showPart(loop.start.part);
      } else if (!openedParts[0] && !openedParts[song.selectedBeat[0]]) {
        handlePartOpen(`${song.selectedBeat[0]}`)
      }
      dispatch(setIsPlaying({isPlaying: true}));
    }
  };

  // Set Start / Set End arm a pick: the next step lamp or bar number
  // clicked becomes that loop point, and picking the start moves straight
  // on to picking the end. Pressing the armed button again (or Esc) cancels.
  const loopPick = song.loopPick ?? null;
  const armLoopPick = (which: 'start' | 'end') => dispatch(setLoopPick(loopPick === which ? null : which));
  useEffect(() => {
    if (!loopPick) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch(setLoopPick(null)); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loopPick, dispatch]);
  const loopRegion = clampRegion(song.loop, song.songStructure);
  const loopOn = !!song.loopEnabled && loopRegion !== null;

  // Space plays/pauses, unless focus is somewhere Space already means
  // something (a text field, or a button Space would click).
  const handleStartClickRef = React.useRef(handleStartClick);
  handleStartClickRef.current = handleStartClick;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, button, [contenteditable="true"], [role="spinbutton"], [role="menuitem"]')) return;
      e.preventDefault();
      handleStartClickRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSourceChange = (source: SoundSource) => {
    if (source === 'midi') {
      if (!midi) handleMidi();
      return;
    }
    if (midi) handleMidi();
    if (acoustic !== (source === 'acoustic')) dispatch(setAcoustic({ acoustic: source === 'acoustic' }));
  };

  const handleToggleTrack = (track: Track) => {
    if (track === 'chords') setIncludeChords(prev => !prev);
    else if (track === 'bass') setIncludeBass(prev => !prev);
    else if (track === 'melody') setIncludeMelody(prev => !prev);
    else setIncludeDrums(prev => !prev);
  };

  const paletteInput: PaletteInput = React.useMemo(() => ({
    songStructure: song.songStructure,
    bpm: song.bpm,
    key: song.key,
    doc: song.doc,
    tuning: song.doc?.tuning ?? song.params?.tuning,
  }), [song.songStructure, song.bpm, song.key, song.doc, song.params]);
  const exportName = `${song.key.replace(/\s+/g, '-')}-${song.bpm}bpm${song.seed != null ? `-${song.seed}` : ''}`;
  const handleCloseSounds = useCallback(() => setSoundsScreen(false), []);
  // The chosen combination lives on the song, so it's saved with it.
  const handleChooseSounds = useCallback((pick: SoundPick | null) => dispatch(setSounds(pick)), [dispatch]);

  // Download the song (with every edit) as a Standard MIDI File for a DAW.
  const handleExport = () => {
    const melody = song.songStructure.map((_, i) => melodyFor(song.doc, song.songStructure, i)?.notes ?? null);
    downloadMidi({ songStructure: song.songStructure, bpm: song.bpm, key: song.key, title: `Song in ${song.key}`, melody }, exportName);
  };

  const handleMidi = async () => {
    if (midi) {
      dispatch(setMidi({midi: false}));
      console.log("Midi off")
    } else {
      dispatch(setMidi({midi: true}));
      navigator.requestMIDIAccess().then(listInputsAndOutputs, onMIDIFailure)
    }
  };

  // The lyrics worksheet takes this much of the window's left side; the
  // part view, piano and intro shift over by it (see --sheet-w in the styles).
  const sheetWidth = showLyrics && authenticated ? 'min(360px, 85vw)' : '0px';

  return (
    <div style={{ '--sheet-w': sheetWidth } as React.CSSProperties}>
      {authenticated ? (
        // Render your app components when authenticated
        <div className={styles.rowContainer}>
        <button
          className={showLyrics ? `${styles.lyricsButton} ${styles.lyricsButtonOn}` : styles.lyricsButton}
          onClick={() => setShowLyrics(open => !open)}
          aria-expanded={showLyrics}
          title={showLyrics ? 'Close the lyrics worksheet' : 'Write lyrics for each part'}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12M2 6.5h12M2 9.5h8M2 12.5h6" /></svg>
          Lyrics
        </button>
        {showLyrics && song.songStructure.length > 0 && (
          <LyricsSheet
            parts={song.songStructure}
            openPart={currentPart}
            onOpenPart={(index) => { if (!(openedParts[index] && currentPart === index)) showPart(index); }}
            onClose={() => setShowLyrics(false)}
          />
        )}
        {showGenerate && (
          <div className={styles.generateOverlay}>
            <Generate onClose={handleCloseGenerate} showAdvanced={isPrivilegedUser}/>
          </div>
        )}
        {saveScreen && (
          <div className={styles.generateOverlay}>
            <Save onClose={handleCloseSave}/>
          </div>
        )}
        {soundsScreen && song.songStructure.length > 0 && (
          <div className={styles.generateOverlay}>
            <Sounds
              input={paletteInput}
              choice={song.sounds ?? null}
              onChoose={handleChooseSounds}
              filename={exportName}
              title={`Song in ${song.key}`}
              onClose={handleCloseSounds}
            />
          </div>
        )}
        {song.songStructure.length > 0 && <Piano ref={pianoRef} lampsRef={lampsRef} />}
        <div className={styles.partsRow}>
        {song.songStructure.map((songProps, index) => {
          const songParts = [];
          const key = `${index}`;
          const isOpen = openedParts[key];
          // Blocks are sized by bars so the row reads as the arrangement.
          const bars = Math.round(songProps.drumGroove.reduce((a, b) => a + b, 0) / 4);
          const shortLabel = SHORT_LABELS[songProps.type as SectionLabel] ?? songProps.type.charAt(0);
          const blockTitle = `${songProps.type} ${songProps.repeat} · ${bars} bars`
            + (songProps.transpose ? ` · +${songProps.transpose} lift` : '')
            + `\n${songProps.chords.filter(c => c !== '-').join('  ')}`;

          return (
            <div key={key} className={styles.parts}>
              <button
                onClick={(e) => {
                  // Clicking the open part's block opens its menu instead.
                  if (isOpen && currentPart === index) {
                    const r = e.currentTarget.getBoundingClientRect();
                    setPartMenu(partMenu?.index === index ? null : { index, left: r.left, top: r.bottom + 4 });
                  } else {
                    setPartMenu(null);
                    handlePartOpen(key);
                  }
                }}
                aria-haspopup={isOpen && currentPart === index ? 'menu' : undefined}
                draggable
                onDragStart={() => handlePartDragStart(index)}
                onDragOver={(e) => handlePartDragOver(e, index)}
                onDrop={(e) => handlePartDrop(e, index)}
                onDragEnd={handlePartDragEnd}
                className={[
                  styles.partButton,
                  isOpen ? styles.openButton : '',
                  draggedPartIndex === index ? styles.draggingPart : '',
                  dragOverPartIndex === index ? styles.dragOverPart : '',
                  loopRegion && beatsInPart(loopRegion, index, sum(songProps.drumGroove)) ? (loopOn ? styles.inLoop : styles.inLoopOff) : '',
                ].filter(Boolean).join(' ')}
                style={{ width: `${Math.max(30, bars * 5)}px` }}
                title={blockTitle}
              >
                {shortLabel}
                {songProps.transpose ? <sup>↑</sup> : null}
                {songProps.energy !== undefined && (
                  <span className={styles.energyBar} style={{ width: `${Math.round(songProps.energy * 100)}%` }} />
                )}
              </button>
              {isOpen && currentPart === index && (() => {
                // During playback the part runs on a screen's width to the
                // right, so its last bar can snap to the left edge like any
                // other. When playback goes on into the next part, that room
                // shows a dimmed preview of it.
                const upNext = isPlaying && !(loopOn && loopRegion?.end.part === index) && index + 1 < song.songStructure.length ? index + 1 : null;
                const wide = { width: isPlaying ? `calc(${renderWidth}px + 100%)` : renderWidth ? `max(${renderWidth}px, 100%)` : '100%' };
                const hasPanel = !!(song.doc && songProps.sectionId && song.doc.sections[songProps.sectionId]);
                // What a part shows: its vocal section, if it has a melody or
                // words, and its sections in view - on phones the one picked
                // (its drums, for a part without that vocal section), on
                // wider screens all but those collapsed.
                const sectionView = (part: number) => {
                  const hasMelody = (melodyFor(song.doc, song.songStructure, part)?.notes.length ?? 0) > 0;
                  const hasWords = placeLyrics(partLyrics(song.songStructure, part).text, song.songStructure[part].drumGroove).syllables.length > 0;
                  const vocal = hasMelody && hasWords ? 'Vocal' : hasMelody ? 'Melody' : hasWords ? 'Lyrics' : null;
                  const open: PartSection = phoneSection === 'words' && !vocal ? 'drums' : phoneSection;
                  return { vocal, open, shows: (section: PartSection) => (isPhone ? open === section : !collapsed[section]) };
                };
                const { vocal: vocalTab, open: phoneOpen, shows } = sectionView(index);
                const partName = (part: number) => `${song.songStructure[part].type} (${song.songStructure[part].repeat})`;
                const tabs: Array<[PartSection, string]> = [['section', 'Section'], ...(vocalTab ? [['words', vocalTab] as [PartSection, string]] : []), ['bass', 'Bass'], ['drums', 'Drums']];
                const titleRow = (
                  <div className={styles.partTitleRow}>
                    {song.doc && song.doc.form.length === song.songStructure.length ? (
                      <h3>
                        <button
                          ref={partTitleRef}
                          className={styles.partTitleButton}
                          onClick={() => setSectionTypeMenuOpen(open => !open)}
                          aria-haspopup="menu"
                          aria-expanded={sectionTypeMenuOpen}
                          title="Change this part to another kind of section"
                        >
                          {songProps.type} ({songProps.repeat})
                          <span className={styles.partTitleCaret} aria-hidden="true">▾</span>
                        </button>
                      </h3>
                    ) : (
                      <h3>{songProps.type} ({songProps.repeat})</h3>
                    )}
                    {sectionTypeMenuOpen && song.doc && (
                      <SectionTypeMenu
                        doc={song.doc}
                        part={index}
                        anchor={partTitleRef}
                        onPick={(label) => handleChangePartSection(index, label)}
                        onClose={closeSectionTypeMenu}
                      />
                    )}
                    {song.doc && songProps.sectionId && (() => {
                      const sharing = linkedCount(song.doc, index);
                      const partOnly = isDetached(song.doc, index);
                      return (
                        <div className={styles.scopeToggle} role="group" aria-label="Which parts edits change">
                          <button
                            className={!partOnly ? styles.scopeOn : ''}
                            aria-pressed={!partOnly}
                            onClick={() => partOnly && dispatch(setPartLinked({ part: index, linked: true }))}
                            title={partOnly
                              ? `Re-link: every linked ${songProps.type.toLowerCase()} takes on this part's current state`
                              : `Edits change this ${songProps.type.toLowerCase()} everywhere it plays`}
                          >
                            All linked{sharing > 1 ? ` (${sharing})` : ''}
                          </button>
                          <button
                            className={partOnly ? styles.scopeOn : ''}
                            aria-pressed={partOnly}
                            onClick={() => !partOnly && dispatch(setPartLinked({ part: index, linked: false }))}
                            title="Edits change only this part (it gets its own copy of the section); other parts stay linked"
                          >
                            This part only
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
                // A part's staff and drum grid: the open part's, or the next
                // part's in its preview - drawn as it will open, but with
                // lamps of its own, no hold on the playback handles, and the
                // part's name where its section headers would be.
                const body = (part: number, isPreview: boolean) => {
                  const { shows: showing } = isPreview ? sectionView(part) : { shows };
                  const caption = isPreview ? partName(part) : undefined;
                  return (
                    <>
                      <BassStaff
                        ref={isPreview ? undefined : bassStaffRef}
                        renderWidth={isPreview ? previewWidth : renderWidth}
                        part={part}
                        lampsRef={isPreview ? previewLampsRef : lampsRef}
                        viewMode={bassViewMode}
                        onViewModeChange={setBassViewMode}
                        showWords={showing('words')}
                        showBass={showing('bass')}
                        onToggleWords={() => toggleSection('words')}
                        onToggleBass={() => toggleSection('bass')}
                        headers={!isPhone}
                        fitHeight={isPhone ? sectionBodyHeight : undefined}
                        syllableArrows={isPhone && !isPreview}
                        headerCaption={caption}
                        fit={fitOf(part)}
                      />
                      <div className={isPhone ? styles.fillSection : undefined} hidden={isPhone && !showing('drums')}>
                        {!isPhone && (caption
                          ? <SectionCaption label={caption} />
                          : <SectionToggle label="Drums" open={showing('drums')} onToggle={() => toggleSection('drums')} />)}
                        {/* Hidden rather than unmounted: its checkboxes mirror the
                            store and its ref plays the part's drums. */}
                        <div className={isPhone ? styles.fillSection : undefined} hidden={!showing('drums')}>
                          <DrumMachine
                            ref={isPreview ? undefined : drumMachineRef}
                            part={part}
                            lampsRef={isPreview ? previewLampsRef : lampsRef}
                            fit={fitOf(part)}
                            fill={isPhone}
                            muted={mutedDrums}
                            onToggleMute={isPreview ? undefined : toggleDrumMute}
                          />
                        </div>
                      </div>
                    </>
                  );
                };
                // The room past the part's end during playback, holding
                // `content` (if any) - read-only.
                const preview = (content: React.ReactNode) => isPlaying && (
                  <div key={upNext ?? 'end'} ref={inert} className={styles.previewPane} style={{ left: renderWidth }}>
                    {content}
                  </div>
                );
                const sections = (
                  <>
                    {isPhone ? (
                      phoneOpen === 'section' && (
                        <div className={styles.stickyHeader}>
                          <FitBox className={styles.fillSection} min={0.55}>
                            {titleRow}
                            {hasPanel && <SectionPanel part={index} />}
                          </FitBox>
                        </div>
                      )
                    ) : (
                      // The title and section controls stay in view while the
                      // staff and grid scroll sideways (by hand or following
                      // playback). Sticky only travels within its parent, so
                      // the parent spans the full scrollable width - the same
                      // arrangement as the section headers further down.
                      <div style={wide}>
                        <div className={styles.stickyHeader}>
                          {titleRow}
                          {hasPanel && (
                            <>
                              <SectionToggle label="Section controls" open={shows('section')} onToggle={() => toggleSection('section')} />
                              {shows('section') && <SectionPanel part={index} />}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {isPhone ? (
                      <>{body(index, false)}{preview(upNext !== null && body(upNext, true))}</>
                    ) : (
                      <div className={styles.partBody} style={wide}>
                        {body(index, false)}
                        {preview(upNext !== null && body(upNext, true))}
                      </div>
                    )}
                  </>
                );
                return (
                  <div className={styles.openedPart} ref={partViewRef}>
                    {/* Bar numbers and lamps stay pinned under the keyboard,
                        whichever sections below are collapsed or scrolled to. */}
                    <div className={styles.trackerBar} style={wide}>
                      <StepTracker
                        onRenderWidthChange={handleRenderWidthChange}
                        part={index}
                        lampsRef={lampsRef}
                        manualSeekEpochRef={manualSeekEpochRef}
                        fit={openFit}
                      />
                      {preview(upNext !== null && (
                        <StepTracker
                          onRenderWidthChange={setPreviewWidth}
                          part={upNext}
                          lampsRef={previewLampsRef}
                          caption={<>Next<br />{partName(upNext)}</>}
                          fit={fitOf(upNext)}
                        />
                      ))}
                    </div>
                    {isPhone ? (
                      <>
                        <div className={styles.sectionTabs} role="tablist" aria-label="Part sections">
                          {tabs.map(([section, label]) => (
                            <button
                              key={section}
                              type="button"
                              role="tab"
                              aria-selected={phoneOpen === section}
                              className={phoneOpen === section ? `${styles.sectionToggle} ${styles.sectionTabOn}` : styles.sectionToggle}
                              onClick={() => setPhoneSection(section)}
                            >
                              <span className={styles.sectionToggleCaret} aria-hidden="true">{phoneOpen === section ? '▾' : '▸'}</span>
                              {label}
                            </button>
                          ))}
                          {phoneOpen === 'bass' && (
                            <button
                              type="button"
                              onClick={() => setBassViewMode(bassViewMode === 'staff' ? 'tab' : 'staff')}
                              className={bassViewMode === 'tab' ? `${styles.viewToggle} ${styles.viewToggleOn}` : styles.viewToggle}
                              title={bassViewMode === 'staff' ? 'Showing the staff: switch to tab' : 'Showing tab: switch to the staff'}
                            >
                              {bassViewMode === 'staff' ? 'Staff' : 'Tab'}
                            </button>
                          )}
                        </div>
                        <div className={styles.sectionBody} ref={sectionBodyRef} style={wide}>
                          {sections}
                        </div>
                      </>
                    ) : sections}
                  </div>
                );
              })()}
            </div>
          );
        })}
        </div>
        <button
          className={styles.undoButton}
          onClick={handleUndo}
          disabled={past.length === 0}
          title={past.length > 0 ? `Undo ${past[past.length - 1].label} (Ctrl/⌘+Z)` : 'Nothing to undo yet'}
        >
          ↶ Undo
        </button>
        {partMenu && song.songStructure[partMenu.index] && (
          <div ref={partMenuRef} className={styles.partMenu} style={{ left: partMenu.left, top: partMenu.top }} role="menu">
            <div className={styles.partMenuTitle}>{song.songStructure[partMenu.index].type} ({song.songStructure[partMenu.index].repeat})</div>
            <button role="menuitem" onClick={() => handleDuplicatePart(partMenu.index)} title="Insert a copy right after this part (linked to it, like any repeat)">
              Duplicate →
            </button>
            <button
              role="menuitem"
              onClick={() => handleDeletePart(partMenu.index)}
              disabled={song.songStructure.length <= 1}
              className={styles.partMenuDanger}
              title="Remove this part from the song"
            >
              Delete
            </button>
            <button role="menuitem" onClick={() => { setPartMenu(null); handlePartOpen(`${partMenu.index}`); }}>
              Close part
            </button>
          </div>
        )}
        {showInfoScreen && !anyPartOpen && (
          <div className={styles.info}>
            <Info phone={isPhone} />
          </div>
        )}
        {/* Renders controls */}
        <div className={styles.footer} ref={footerRef}>
        <Transport
          songKey={song.key}
          onKeyClick={handleGenerateClick}
          source={midi ? 'midi' : acoustic ? 'acoustic' : 'synth'}
          onSourceChange={handleSourceChange}
          isPlaying={isPlaying}
          onPlay={handleStartClick}
          bpm={bpm}
          onBpmChange={(value) => dispatch(incrementByAmount(`${value}`))}
          metronome={metronome}
          onToggleMetronome={() => setMetronome(on => !on)}
          metronomeRef={metronomeButtonRef}
          realism={realism}
          onToggleRealism={() => setRealism(on => !on)}
          tracks={{ chords: includeChords, bass: includeBass, drums: includeDrums, melody: includeMelody }}
          hasMelody={!!song.doc?.melody}
          onToggleTrack={handleToggleTrack}
          loopOn={loopOn}
          hasLoop={!!loopRegion}
          onToggleLoop={() => dispatch(toggleLoop())}
          loopPick={loopPick}
          onArmLoopPick={armLoopPick}
          loopReadout={loopPick
            ? `Click a step or bar number for the loop ${loopPick} (Esc to cancel)`
            : loopRegion
              ? `${describePoint(loopRegion.start, song.songStructure)} → ${describePoint(loopRegion.end, song.songStructure)}`
              : 'No loop set'}
          hasSong={song.songStructure.length > 0}
          onSave={handleSaveClick}
          onSounds={() => setSoundsScreen(true)}
          onExport={handleExport}
          onLogout={logout}
          songTabs={canUseSongTabs ? { count: SONG_TAB_COUNT, current: currentTabIndex, onSwitch: handleTabSwitch } : undefined}
        />
        {canUseSongTabs && (
          <div className={styles.songTabs}>
            {Array.from({ length: SONG_TAB_COUNT }, (_, index) => (
              <button
                key={index}
                onClick={() => handleTabSwitch(index)}
                className={currentTabIndex === index ? `${styles.tabButton} ${styles.openButton}` : styles.tabButton}
              >
                T{index + 1}
              </button>
            ))}
          </div>
        )}
        </div>
        </div>
      ) : (
        <div className={styles.loginButtons}>
          {import.meta.env.DEV && (
            <button className={styles.ghostButton} onClick={devLogin}>Dev Login</button>
          )}
          <button className={styles.primaryButton} onClick={login}>Log In with Google</button>
        </div>
      )}
    </div>
  );
}

export default App;
