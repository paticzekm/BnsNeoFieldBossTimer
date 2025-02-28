import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

const BOSS_TIMERS = {
  Jiangshi: { 'Boss Dead': 300, 'Variant Spawning': 120, 'Variant Dead': 480 },
  Gigantura: { 'Boss Dead': 300, 'Variant Spawning': 120, 'Variant Dead': 480 },
  WuFu: { 'Boss Dead': 300, 'Variant Spawning': 120, 'Variant Dead': 480 },
  Pinchy: { 'Boss Dead': 300, 'Variant Spawning': 120, 'Variant Dead': 480 },
  GoldenDeva: {
    'Boss Dead': 300,
    'Variant Spawning': 120,
    'Variant Dead': 480,
  },
  Bulbari: { 'Boss Dead': 300, 'Variant Spawning': 120, 'Variant Dead': 480 },
};

const alertSound = new Audio('/alert.mp3');
const silentSound = new Audio('/silence.mp3');

export default function App() {
  const [selectedBoss, setSelectedBoss] = useState(
    () => localStorage.getItem('selectedBoss') || 'Jiangshi'
  );
  const TIMER_VALUES = BOSS_TIMERS[selectedBoss];
  const [timers, setTimers] = useState([]);
  const [volume, setVolume] = useState(
    () => parseFloat(localStorage.getItem('volume')) || 0.5
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(
    () => JSON.parse(localStorage.getItem('audioEnabled')) || false
  );
  const [interactionOccurred, setInteractionOccurred] = useState(false);
  const channelRef = useRef([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    channelRef.current = Array(5)
      .fill()
      .map((_, i) => channelRef.current[i] || React.createRef());
  }, []);

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const newState = !prev;
      if (newState) {
        alertSound.play().catch(() => {});
        alertSound.pause();
        alertSound.currentTime = 0;
      }
      return newState;
    });
  };

  useEffect(() => {
    localStorage.setItem('selectedBoss', selectedBoss);
  }, [selectedBoss]);

  useEffect(() => {
    localStorage.setItem('audioEnabled', JSON.stringify(audioEnabled));
  }, [audioEnabled]);

  useEffect(() => {
    if (!interactionOccurred) {
      const enableSilentAudio = () => {
        silentSound.play().catch(() => {});
        silentSound.pause();
        silentSound.currentTime = 0;
        setInteractionOccurred(true);
      };

      document.addEventListener('mousemove', enableSilentAudio, { once: true });
      document.addEventListener('keydown', enableSilentAudio, { once: true });
      document.addEventListener('touchstart', enableSilentAudio, {
        once: true,
      });

      return () => {
        document.removeEventListener('mousemove', enableSilentAudio);
        document.removeEventListener('keydown', enableSilentAudio);
        document.removeEventListener('touchstart', enableSilentAudio);
      };
    }
  }, [interactionOccurred]);

  useEffect(() => {
    const fetchTimers = async () => {
      let { data, error } = await supabase
        .from('timers')
        .select('*')
        .eq('boss', selectedBoss);
      if (error) {
        console.error('Błąd pobierania timerów:', error);
      } else {
        await supabase.from('timers').delete().lt('end_time', Date.now());

        setTimers(
          data
            .filter((t) => t.end_time > Date.now())
            .map((t) => ({
              id: t.id,
              channel: t.channel,
              type: t.type,
              endTime: t.end_time,
              timeLeft: Math.max(
                0,
                Math.ceil((t.end_time - Date.now()) / 1000)
              ),
            }))
            .sort((a, b) => a.endTime - b.endTime)
        );
      }
    };
    fetchTimers();
  }, [selectedBoss]);

  useEffect(() => {
    const subscription = supabase
      .channel('timers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timers' },
        async (payload) => {
          if (payload.new.boss === selectedBoss) {
            setTimers((prev) => {
              const updatedTimers = prev.filter(
                (t) => t.channel !== payload.new.channel
              );
              return [
                ...updatedTimers,
                {
                  id: payload.new.id,
                  channel: payload.new.channel,
                  type: payload.new.type,
                  endTime: payload.new.end_time,
                  timeLeft: Math.max(
                    0,
                    Math.ceil((payload.new.end_time - Date.now()) / 1000)
                  ),
                },
              ].sort((a, b) => a.endTime - b.endTime);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedBoss]);

  useEffect(() => {
    localStorage.setItem('volume', volume);
    alertSound.volume = volume;
  }, [volume]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setTimers((prev) => {
        let shouldPlay = false;
        const updatedTimers = prev
          .map((t) => {
            const timeLeft = Math.max(
              0,
              Math.ceil((t.endTime - Date.now()) / 1000)
            );
            if (timeLeft <= 10 && timeLeft > 0 && audioEnabled) {
              shouldPlay = true;
            }
            if (timeLeft === 0) {
              return null;
            }
            return { ...t, timeLeft };
          })
          .filter(Boolean)
          .sort((a, b) => a.endTime - b.endTime);

        if (updatedTimers.length > 0) {
          const nextTimer = updatedTimers[0];
          document.title = `${selectedBoss} - ${
            nextTimer.channel
          } - ${Math.floor(nextTimer.timeLeft / 60)}:${String(
            nextTimer.timeLeft % 60
          ).padStart(2, '0')} left`;
        } else {
          document.title = 'Field Boss Timer';
        }

        if (shouldPlay) {
          if (!isPlaying) {
            alertSound.loop = true;
            alertSound.play();
            setIsPlaying(true);
          }
        } else {
          if (isPlaying) {
            alertSound.pause();
            alertSound.currentTime = 0;
            setIsPlaying(false);
          }
        }

        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, isPlaying, selectedBoss, audioEnabled]);

  const handleStartTimer = (type, index) => {
    const channelValue = channelRef.current[index].current?.value?.trim();
    if (
      !channelValue ||
      isNaN(channelValue) ||
      channelValue < 1 ||
      channelValue > 50
    ) {
      console.error('Nieprawidłowy kanał');
      return;
    }
    startTimer(channelValue, type);
  };

  const startTimer = async (channel, type) => {
    if (!channel || !type || isProcessing) return;

    setIsProcessing(true);

    const existingTimer = timers.find(
      (t) => t.channel === channel && t.type === type
    );
    if (existingTimer) {
      setIsProcessing(false);
      return;
    }

    const endTime = Date.now() + TIMER_VALUES[type] * 1000;

    await supabase
      .from('timers')
      .delete()
      .or(
        `end_time.lt.${Date.now()},and(boss.eq.${selectedBoss},channel.eq.${channel})`
      );

    const { error } = await supabase.from('timers').insert([
      {
        boss: selectedBoss,
        channel,
        type,
        end_time: endTime,
      },
    ]);

    setIsProcessing(false);

    if (error) {
      console.error('Błąd zapisu do Supabase:', error);
    }
  };

  return (
    <div className="p-4 max-w-full mx-auto text-white bg-gray-900 min-h-screen flex items-center justify-center w-full h-full overflow-auto flex-wrap">
      <style>
        {`
          @keyframes blink {
            0% { background-color: red; }
            50% { background-color: transparent; }
            100% { background-color: red; }
          }
          .blink {
            animation: blink 1s infinite;
          }
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #1a1a1a;
          }
        `}
      </style>
      <div className="w-full max-w-7xl px-4 flex flex-col items-center justify-center">
        <div className="flex items-center justify-between w-full relative mb-4">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2 flex-grow">
            <h1 className="text-2xl text-nowrap font-bold">
              Field Boss Timer ({selectedBoss})
            </h1>
            <div className="relative group flex items-center">
              <HelpCircle className="text-white cursor-pointer" size={24} />
              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 p-2 text-sm bg-gray-800 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <p>
                  <strong>Boss Dead</strong> - Click when boss is killed
                </p>
                <p>
                  <strong>Variant Spawning</strong> - Click when lightning
                  spawns after boss is killed
                </p>
                <p>
                  <strong>Variant Dead</strong> - Click when lightning boss is
                  killed
                </p>
              </div>
            </div>
            <select
              className="ml-4 p-2 bg-gray-800 text-white rounded"
              value={selectedBoss}
              onChange={(e) => setSelectedBoss(e.target.value)}
            >
              {Object.keys(BOSS_TIMERS).map((boss) => (
                <option key={boss} value={boss}>
                  {boss}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleAudio}>
              {audioEnabled ? (
                <Volume2 className="text-white" size={24} />
              ) : (
                <VolumeX className="text-white" color="red" size={24} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-24"
            />
          </div>
        </div>
        <div className="mb-4 p-4 bg-gray-800 rounded-lg w-full text-center">
          <h2 className="text-xl font-semibold">Boss Timeline</h2>
          {timers.length === 0 ? (
            <p className="text-gray-400">No active timers.</p>
          ) : (
            timers.map((t, index) => (
              <div
                key={index}
                className={`mt-2 p-2 rounded-lg text-white text-center ${
                  t.timeLeft <= 10
                    ? 'blink'
                    : t.type === 'Variant Spawning'
                    ? 'bg-orange-500'
                    : 'bg-gray-700'
                }`}
              >
                {t.channel} channel - {t.type} - {Math.floor(t.timeLeft / 60)}:
                {String(t.timeLeft % 60).padStart(2, '0')}
              </div>
            ))
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
          {[...Array(5)].map((_, i) => (
            <div className="p-4 bg-gray-800 rounded-lg flex flex-col items-center text-nowrap ">
              <input
                type="text"
                placeholder="Enter channel (1-50)"
                ref={channelRef.current[i]}
                className="p-2 text-black rounded w-full text-center mb-4"
              />

              {Object.keys(TIMER_VALUES).map((type) => (
                <button
                  key={type}
                  className="mt-2 w-full p-2 rounded bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleStartTimer(type, i)}
                >
                  {type}
                </button>
              ))}
            </div>
          ))}
        </div>

        <footer className="mt-auto text-gray-400 text-sm text-center w-full py-2">
          Created by Lolicaust © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
