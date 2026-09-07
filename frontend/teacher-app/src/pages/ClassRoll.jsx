import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { apiRequest } from '../api';
import useNfcReader from '../hooks/useNfcReader';

const statusOptions = ['absent', 'present', 'late', 'excused'];

export default function ClassRoll() {
  const token = useContext(AuthContext);
  const scanInputRef = useRef(null);
  const processingRef = useRef(false);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [roll, setRoll] = useState(null);
  const [scanValue, setScanValue] = useState('');
  const [linkingStudent, setLinkingStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const authenticatedRequest = useCallback((path, options = {}) => (
    apiRequest(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    })
  ), [token]);

  const loadRoll = useCallback(async (selectedClassId = classId, silent = false) => {
    if (!selectedClassId) return;
    if (!silent) setLoading(true);
    try {
      const data = await authenticatedRequest(`/roll/${selectedClassId}`);
      setRoll(data);
    } catch (error) {
      if (!silent) setNotice({ type: 'error', text: error.message });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authenticatedRequest, classId]);

  useEffect(() => {
    let active = true;
    authenticatedRequest('/roll/classes')
      .then((data) => {
        if (!active) return;
        setClasses(data);
        if (data.length) setClassId(String(data[0].id));
        else setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setNotice({ type: 'error', text: error.message });
        setLoading(false);
      });
    return () => { active = false; };
  }, [authenticatedRequest]);

  useEffect(() => {
    if (!classId) return undefined;
    const initialLoad = window.setTimeout(() => void loadRoll(classId), 0);
    const timer = window.setInterval(() => void loadRoll(classId, true), 3000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [classId, loadRoll]);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, [linkingStudent]);

  const handleTag = useCallback(async (rawTagId) => {
    const tagId = rawTagId.trim();
    if (!tagId || processingRef.current) return;

    processingRef.current = true;
    try {
      if (linkingStudent) {
        await authenticatedRequest(`/student/${linkingStudent.studentId}/nfc`, {
          method: 'PUT',
          body: JSON.stringify({ tagId })
        });
        setNotice({
          type: 'success',
          text: `Card linked to ${linkingStudent.name}`
        });
        setLinkingStudent(null);
      } else {
        const result = await authenticatedRequest('/nfc/tap', {
          method: 'POST',
          body: JSON.stringify({ tagId })
        });
        setNotice({ type: 'success', text: `${result.student.name} is present` });
      }
      setScanValue('');
      await loadRoll(classId, true);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      processingRef.current = false;
      window.setTimeout(() => scanInputRef.current?.focus(), 0);
    }
  }, [authenticatedRequest, classId, linkingStudent, loadRoll]);

  const reader = useNfcReader(handleTag);

  const submitScan = (event) => {
    event.preventDefault();
    void handleTag(scanValue);
  };

  const connectReader = async (method) => {
    try {
      await method();
      setNotice({ type: 'success', text: 'NFC reader connected and ready' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    }
  };

  const updateStatus = async (studentId, status) => {
    try {
      await authenticatedRequest(`/roll/${classId}/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setNotice({ type: 'success', text: 'Attendance updated' });
      await loadRoll(classId, true);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    }
  };

  const unlinkCard = async (student) => {
    if (!window.confirm(`Unlink the NFC card from ${student.name}?`)) return;
    try {
      await authenticatedRequest(`/student/${student.studentId}/nfc`, {
        method: 'DELETE'
      });
      setNotice({ type: 'success', text: `Card unlinked from ${student.name}` });
      await loadRoll(classId, true);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    }
  };

  const students = roll?.students || [];
  const presentCount = students.filter((student) => student.status === 'present').length;

  return (
    <main className="roll-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Live attendance</p>
          <h1>Class roll</h1>
          <p>Tap a linked student card to mark them present.</p>
        </div>
        <label className="class-picker">
          Class
          <select value={classId} onChange={(event) => setClassId(event.target.value)}>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.className} · Period {item.period}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={`reader-panel ${linkingStudent ? 'is-linking' : ''}`}>
        <div className="reader-copy">
          <span className="reader-dot" aria-hidden="true" />
          <div>
            <h2>{linkingStudent ? `Link a card to ${linkingStudent.name}` : 'NFC reader'}</h2>
            <p>
              {linkingStudent
                ? 'Tap the student’s card now, or enter its UID below.'
                : reader.connection}
            </p>
          </div>
        </div>

        <form className="scan-form" onSubmit={submitScan}>
          <input
            ref={scanInputRef}
            value={scanValue}
            onChange={(event) => setScanValue(event.target.value)}
            placeholder="Tap card or enter card UID"
            aria-label="NFC card UID"
            autoComplete="off"
            autoFocus
          />
          <button type="submit">{linkingStudent ? 'Link card' : 'Mark present'}</button>
          {linkingStudent && (
            <button type="button" className="button-secondary" onClick={() => setLinkingStudent(null)}>
              Cancel
            </button>
          )}
        </form>

        <div className="reader-actions">
          {reader.serialSupported && (
            <button type="button" className="button-secondary" onClick={() => void connectReader(reader.connectSerial)}>
              Connect USB serial reader
            </button>
          )}
          {reader.webNfcSupported && (
            <button type="button" className="button-secondary" onClick={() => void connectReader(reader.connectWebNfc)}>
              Connect Web NFC
            </button>
          )}
          <span>Keyboard-style readers work in the scan box automatically.</span>
        </div>
      </section>

      {notice && (
        <div className={`notice ${notice.type}`} role="status">
          {notice.text}
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <section className="roll-card">
        <header className="roll-card-heading">
          <div>
            <h2>{roll?.class.className || 'Students'}</h2>
            {roll?.class.room && <p>Room {roll.class.room}</p>}
          </div>
          <div className="attendance-total">
            <strong>{presentCount}</strong>
            <span>of {students.length} present</span>
          </div>
        </header>

        {loading ? (
          <p className="empty-state">Loading class roll…</p>
        ) : students.length === 0 ? (
          <p className="empty-state">There are no students assigned to this class.</p>
        ) : (
          <div className="student-list">
            {students.map((student) => (
              <article className="student-row" key={student.studentId}>
                <div className="student-identity">
                  <span className="student-avatar" aria-hidden="true">
                    {student.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <h3>{student.name}</h3>
                    <p>{student.email || `Student ${student.studentId}`}</p>
                  </div>
                </div>

                <div className="card-state">
                  <span className={student.nfcLinked ? 'linked' : 'unlinked'}>
                    {student.nfcLinked ? 'Card linked' : 'No card'}
                  </span>
                  {student.nfcLinked ? (
                    <button type="button" className="text-button" onClick={() => void unlinkCard(student)}>
                      Unlink
                    </button>
                  ) : (
                    <button type="button" className="text-button" onClick={() => setLinkingStudent(student)}>
                      Link card
                    </button>
                  )}
                </div>

                <label className={`status-control status-${student.status}`}>
                  <span className="sr-only">Attendance status for {student.name}</span>
                  <select
                    value={student.status}
                    onChange={(event) => void updateStatus(student.studentId, event.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status[0].toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <time className="last-updated">
                  {student.timestamp
                    ? new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Not marked'}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
