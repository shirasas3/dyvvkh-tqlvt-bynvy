import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCheck,
  ClipboardList,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Wrench,
} from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { useAction, useIssuesList } from './hooks/useIssues';
import * as api from './lib/api';


function describeError(value) {
  if (value instanceof Error && value.message) return value.message;
  if (value && typeof value === 'object') {
    const candidate = value;
    const message =
      candidate.message ??
      candidate.data?.message ??
      candidate.data?.error ??
      candidate.response?.data?.message ??
      candidate.response?.data?.error;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'לא ניתן להשלים את הבקשה כרגע. כדאי לנסות שוב בעוד רגע.';
}

function Home() {
  const [mode, setMode] = useState('view');
  const [tab, setTab] = useState('open');
  const [reporterName, setReporterName] = useState('');
  const [issueType, setIssueType] = useState('');
  const [location, setLocation] = useState('');
  const [notificationWarning, setNotificationWarning] = useState(false);
  const issuesQuery = useIssuesList();
  const afterChange = async (result) => {
    setNotificationWarning(!result.notificationSent);
    await issuesQuery.refetch();
  };
  const createIssue = useAction(api.createIssue, async (result) => {
    await afterChange(result);
    setReporterName('');
    setIssueType('');
    setLocation('');
    setTab('open');
  });
  const updateIssue = useAction(api.updateIssue, afterChange);
  const deleteIssueMutation = useAction(api.deleteIssue, afterChange);

  const issues = issuesQuery.data ?? [];
  const openIssues = issues.filter((issue) => issue.status === 'open');
  const resolvedIssues = issues.filter((issue) => issue.status === 'resolved');
  const visibleIssues = tab === 'open' ? openIssues : resolvedIssues;

  function submitIssue(event) {
    event.preventDefault();
    const trimmedType = issueType.trim();
    const trimmedLocation = location.trim();
    const trimmedReporterName = reporterName.trim();
    if (!trimmedReporterName || !trimmedType || !trimmedLocation || createIssue.isPending) return;
    createIssue.run({
        issueType: trimmedType,
        location: trimmedLocation,
        reporterName: trimmedReporterName,
      });
  }

  function changeStatus(issue) {
    if (updateIssue.isPending) return;
    updateIssue.run({ id: issue.id, status: issue.status === 'open' ? 'resolved' : 'open' });
  }

  function removeIssue(issue) {
    if (deleteIssueMutation.isPending) return;
    const confirmed = window.confirm(
      `למחוק לצמיתות את התקלה "${issue.issueType}"?`,
    );
    if (!confirmed) return;
    deleteIssueMutation.run({ id: issue.id });
  }

  return (
    <div className="page-shell" dir="rtl">
      <div className="top-rule" />
      <header className="app-header">
        <div className="brand">
          <img
            className="brand-mark"
            src={`${import.meta.env.BASE_URL}hiltonians-emblem.jpeg`}
            alt="סמל ההילטונים"
          />
          <div>
            <div className="brand-kicker">דיווח תקלות בינוי</div>
            <h1>ההילטונים</h1>
          </div>
        </div>
        <div className="header-meta" aria-label="לוח משותף ללוחמי הטייסת">
          <span className="live-dot" />
          <span>לוח משותף ללוחמי הטייסת</span>
        </div>
      </header>

      <main className="main-wrap">
        <section className="intro-row" aria-label="מצב שימוש">
          <div className="mode-switch" role="group" aria-label="בחירת מצב">
            <button
              type="button"
              className={`mode-button ${mode === 'view' ? 'selected' : ''}`}
              aria-pressed={mode === 'view'}
              data-testid="button-mode-view"
              onClick={() => setMode('view')}
            >
              מצב תצוגה
            </button>
            <button
              type="button"
              className={`mode-button ${mode === 'edit' ? 'selected' : ''}`}
              aria-pressed={mode === 'edit'}
              data-testid="button-mode-edit"
              onClick={() => setMode('edit')}
            >
              מצב עריכה
            </button>
          </div>
        </section>

        <section className="board" aria-label="רשימת תקלות">
          <div className="board-top">
            <div className="tab-row" role="tablist" aria-label="מצב טיפול">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'open'}
                className={`tab-button ${tab === 'open' ? 'active' : ''}`}
                data-testid="tab-open-issues"
                onClick={() => setTab('open')}
              >
                תקלות פתוחות <span className="count-pill" data-testid="count-open">{openIssues.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'resolved'}
                className={`tab-button ${tab === 'resolved' ? 'active' : ''}`}
                data-testid="tab-resolved-issues"
                onClick={() => setTab('resolved')}
              >
                תקלות שטופלו <span className="count-pill" data-testid="count-resolved">{resolvedIssues.length}</span>
              </button>
            </div>
            <div className="board-caption">
              <span className="caption-count">
                <span className="caption-symbol" aria-hidden="true"><ClipboardList size={16} /></span>
                {tab === 'open' ? 'מעקב אחר דברים שממתינים לטיפול' : 'תיעוד התקלות שכבר טופלו'}
              </span>
              {mode === 'edit' && tab === 'open' && (
                <span>אפשר להוסיף דיווח חדש למטה</span>
              )}
            </div>
          </div>

          {mode === 'edit' && (
            <section className="form-panel" aria-labelledby="form-title">
              <div className="form-heading">
                <div className="form-icon" aria-hidden="true"><Plus size={20} /></div>
                <div>
                  <h3 id="form-title">דיווח על תקלה חדשה</h3>
                  <p>נוסיף אותה לרשימת התקלות הפתוחות.</p>
                </div>
              </div>
              <form className="issue-form" onSubmit={submitIssue}>
                <div className="field">
                  <label htmlFor="reporter-name">שם המדווח</label>
                  <input
                    id="reporter-name"
                    type="text"
                    placeholder="למשל ישראל ישראלי"
                    value={reporterName}
                    onChange={(event) => setReporterName(event.target.value)}
                    maxLength={120}
                    required
                    autoComplete="name"
                    data-testid="input-reporter-name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="issue-type">סוג התקלה</label>
                  <input
                    id="issue-type"
                    type="text"
                    placeholder="למשל מזגן מטפטף"
                    value={issueType}
                    onChange={(event) => setIssueType(event.target.value)}
                    maxLength={160}
                    required
                    autoComplete="off"
                    data-testid="input-issue-type"
                  />
                </div>
                <div className="field">
                  <label htmlFor="issue-location">מיקום</label>
                  <input
                    id="issue-location"
                    type="text"
                    placeholder="למשל כניסה 2, קומה 1, שמאל שמאל"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    maxLength={300}
                    required
                    autoComplete="off"
                    data-testid="input-issue-location"
                  />
                </div>
                <button className="primary-button" type="submit" disabled={createIssue.isPending} data-testid="button-submit-issue">
                  {createIssue.isPending ? <><span className="small-spinner" /> שומר דיווח…</> : <><Plus size={17} /> הוספת תקלה</>}
                </button>
              </form>
              {createIssue.isError && (
                <div className="form-error" role="alert" data-testid="error-create-issue">
                  <AlertCircle size={17} />
                  <span>שמירת הדיווח נכשלה: {describeError(createIssue.error)}</span>
                </div>
              )}
            </section>
          )}

          {notificationWarning && (
            <div className="request-error notification-warning" role="alert" data-testid="warning-email-notification">
              <AlertCircle size={17} />
              <span>השינוי נשמר, אך התראת המייל לא נשלחה. אפשר לבדוק את הגדרות EmailJS.</span>
              <button type="button" onClick={() => setNotificationWarning(false)}>סגירה</button>
            </div>
          )}

          {issuesQuery.isLoading ? (
            <div className="skeleton-area" aria-label="טוען את רשימת התקלות" data-testid="loading-issues">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : issuesQuery.isError && !issuesQuery.data ? (
            <div className="load-error" role="alert" data-testid="error-load-issues">
              <AlertCircle size={25} color="#a35b4e" />
              <h3>לא הצלחנו לטעון את רשימת התקלות</h3>
              <p>{describeError(issuesQuery.error)}</p>
              <button type="button" className="retry-button" onClick={() => issuesQuery.refetch()} data-testid="button-retry-issues">
                <RotateCcw size={15} /> לנסות שוב
              </button>
            </div>
          ) : (
            <>
              {issuesQuery.isError && (
                <div className="request-error" role="alert" data-testid="error-refresh-issues">
                  <AlertCircle size={17} />
                  <span>העדכון האחרון לא התקבל: {describeError(issuesQuery.error)}</span>
                  <button type="button" onClick={() => issuesQuery.refetch()}>לנסות שוב</button>
                </div>
              )}
              {updateIssue.isError && (
                <div className="request-error" role="alert" data-testid="error-update-issue">
                  <AlertCircle size={17} />
                  <span>עדכון הסטטוס נכשל: {describeError(updateIssue.error)}</span>
                  <button type="button" onClick={() => updateIssue.reset()}>סגירה</button>
                </div>
              )}
              {deleteIssueMutation.isError && (
                <div className="request-error" role="alert" data-testid="error-delete-issue">
                  <AlertCircle size={17} />
                  <span>מחיקת התקלה נכשלה: {describeError(deleteIssueMutation.error)}</span>
                  <button type="button" onClick={() => deleteIssueMutation.reset()}>סגירה</button>
                </div>
              )}
              {visibleIssues.length === 0 ? (
                <div className="empty-state" data-testid={`empty-${tab}-issues`}>
                  <div className="empty-art" aria-hidden="true">
                    {tab === 'open' ? <CheckCheck size={28} strokeWidth={1.7} /> : <ClipboardList size={27} strokeWidth={1.7} />}
                  </div>
                  <h3>{tab === 'open' ? 'אין תקלות פתוחות כרגע' : 'עדיין אין תקלות שטופלו'}</h3>
                  <p>{tab === 'open'
                    ? mode === 'edit' ? 'הכול מסודר. אם תתגלה תקלה, אפשר להוסיף דיווח חדש כאן.' : 'הכול מסודר כרגע. אפשר לחזור לבדוק בהמשך.'
                    : 'כשמשנים סטטוס של תקלה ל״טופל״, היא תופיע ברשימה הזו.'}</p>
                </div>
              ) : (
                <div className="issue-list" role="tabpanel" aria-label={tab === 'open' ? 'תקלות פתוחות' : 'תקלות שטופלו'}>
                  {visibleIssues.map((issue) => (
                    <article className="issue-card" key={issue.id} data-testid={`card-issue-${issue.id}`}>
                      <div className="issue-main">
                        <div className="issue-symbol" aria-hidden="true"><Wrench size={18} /></div>
                        <div>
                          <h3 className="issue-title" data-testid={`text-issue-type-${issue.id}`}>{issue.issueType}</h3>
                          <div className="issue-location" data-testid={`text-issue-location-${issue.id}`}>
                            <MapPin size={14} aria-hidden="true" /> {issue.location}
                          </div>
                          <div className="issue-reporter" data-testid={`text-issue-reporter-${issue.id}`}>
                            שם המדווח: {issue.reporterName || 'לא צוין'}
                          </div>
                          <div className="issue-meta">
                            <span className={`status-tag ${issue.status}`} data-testid={`status-issue-${issue.id}`}>
                              <span className="status-point" />{issue.status === 'open' ? 'לא טופל' : 'טופל'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {mode === 'edit' && (
                        <div className="card-actions">
                          <button
                            type="button"
                            className={`status-button ${issue.status === 'resolved' ? 'reopen' : ''}`}
                            onClick={() => changeStatus(issue)}
                            disabled={updateIssue.isPending || deleteIssueMutation.isPending}
                            aria-label={issue.status === 'open' ? `סימון ${issue.issueType} כטופל` : `העברת ${issue.issueType} חזרה לתקלות פתוחות`}
                            data-testid={`button-status-${issue.id}`}
                          >
                            {updateIssue.isPending && updateIssue.variables?.id === issue.id
                              ? <><span className="small-spinner" /> מעדכן…</>
                              : issue.status === 'open'
                                ? <><Check size={16} /> סימון כטופל</>
                                : <><ArrowRight size={16} /> החזרה לפתוחות</>}
                          </button>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => removeIssue(issue)}
                            disabled={updateIssue.isPending || deleteIssueMutation.isPending}
                            aria-label={`מחיקת התקלה ${issue.issueType}`}
                            data-testid={`button-delete-${issue.id}`}
                          >
                            {deleteIssueMutation.isPending && deleteIssueMutation.variables?.id === issue.id
                              ? <><span className="small-spinner" /> מוחק…</>
                              : <><Trash2 size={15} /> מחיקה</>}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <div className="footer-note">
          <span>לוח תחזוקה משותף · כל העדכונים נשמרים ומופיעים לכל הדיירים</span>
          <span className="footer-status" aria-live="polite">
            {issuesQuery.isFetching ? <><span className="small-spinner" /> מסנכרן עדכונים</> : <><span className="live-dot" /> הרשימה מעודכנת</>}
          </span>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}
