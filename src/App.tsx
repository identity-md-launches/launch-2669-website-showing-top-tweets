import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronDown, CircleHelp, Code2, Compass, Cpu, Flame, Leaf, Search, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react'
import TweetCard, { Avatar } from './components/TweetCard'
import { capturedAt, fullDate, selectTweets, shortDate, topics, tweets, X_SEARCH } from './data'
import type { Order, Topic, Tweet, View } from './data'

const STORAGE_KEY = 'the-pond:saved-tweets:v1'
const topicIcons = { All: Compass, Building: Code2, Agents: Cpu, Culture: Users }
const topicDescriptions = { Building: 'Things being shipped', Agents: 'Inside the swarm', Culture: 'The people behind it' }

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && tweets.some(tweet => tweet.id === id)) : []
  } catch { return [] }
}

function FrogMark() {
  return <img className="frog-mark" src="./favicon.svg" alt="" width="38" height="38" />
}

function NavLinks({ view, savedCount, onAbout }: { view: View; savedCount: number; onAbout: () => void }) {
  return <>
    <a className={`nav-item${view === 'feed' ? ' active' : ''}`} href="#feed" aria-current={view === 'feed' ? 'page' : undefined}><Compass size={20} /><span>The feed</span><ArrowRight className="nav-arrow" size={17} /></a>
    <a className={`nav-item${view === 'saved' ? ' active' : ''}`} href="#saved" aria-current={view === 'saved' ? 'page' : undefined}><Bookmark size={20} /><span>Saved tweets</span>{savedCount > 0 && <span className="nav-count">{savedCount}</span>}</a>
    <button className="nav-item" onClick={onAbout}><CircleHelp size={20} /><span>About</span></button>
  </>
}

function App() {
  const [view, setView] = useState<View>(location.hash === '#saved' ? 'saved' : 'feed')
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic>('All')
  const [month, setMonth] = useState('all')
  const [order, setOrder] = useState<Order>('likes')
  const [saved, setSaved] = useState<string[]>(readSaved)
  const [notice, setNotice] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyFallback, setCopyFallback] = useState<Tweet | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const aboutRef = useRef<HTMLDialogElement>(null)
  const copyRef = useRef<HTMLDialogElement>(null)
  const feedRef = useRef<HTMLElement>(null)

  const results = useMemo(() => selectTweets({ query, topic, month, order, view, saved }), [query, topic, month, order, view, saved])
  const voices = useMemo(() => [...new Map(tweets.map(tweet => [tweet.author.handle, tweet.author])).values()]
    .sort((a, b) => tweets.filter(t => t.author.handle === b.handle).reduce((sum, t) => sum + t.likes, 0) - tweets.filter(t => t.author.handle === a.handle).reduce((sum, t) => sum + t.likes, 0)).slice(0, 3), [])
  const filtersActive = query !== '' || topic !== 'All' || month !== 'all'

  useEffect(() => {
    const route = () => {
      setView(location.hash === '#saved' ? 'saved' : 'feed')
      setQuery(''); setTopic('All'); setMonth('all'); setNotice('')
    }
    window.addEventListener('hashchange', route)
    return () => window.removeEventListener('hashchange', route)
  }, [])

  useEffect(() => {
    document.title = view === 'saved' ? 'Saved tweets · The Pond' : 'The Pond · Top Identity MD tweets'
  }, [view])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !aboutRef.current?.open && !copyRef.current?.open && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || (event.target instanceof HTMLElement && event.target.isContentEditable))) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (copyFallback) {
      copyRef.current?.showModal()
      copyRef.current?.querySelector('input')?.select()
    }
  }, [copyFallback])

  function saveTweet(id: string) {
    const wasSaved = saved.includes(id)
    const next = wasSaved ? saved.filter(item => item !== id) : [...saved, id]
    setSaved(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setNotice(wasSaved ? 'Tweet removed from saved.' : 'Tweet saved in this browser.')
    } catch {
      setNotice(wasSaved ? 'Tweet removed for this visit. Browser storage is unavailable.' : 'Tweet saved for this visit. Browser storage is unavailable.')
    }
  }

  async function copyTweet(tweet: Tweet) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(tweet.url)
      setCopiedId(tweet.id)
      setNotice(`Copied the link to ${tweet.author.name}’s tweet.`)
    } catch {
      setCopyFallback(tweet)
    }
  }

  function clearFilters() { setQuery(''); setTopic('All'); setMonth('all') }
  function chooseTopic(value: Topic) {
    setTopic(value)
    feedRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
  function openAbout() { aboutRef.current?.showModal() }

  return <>
    <a className="skip-link" href="#main-content">Skip to feed</a>
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#feed" aria-label="The Pond home"><FrogMark /><span>the pond<span className="brand-period">.</span></span></a>
        <span className="header-context">A little corner of Identity MD.</span>
        <a className="header-x" href={X_SEARCH} target="_blank" rel="noreferrer"><span className="x-logo" aria-hidden="true">𝕏</span><span>Search on X</span><ArrowUpRight size={16} /></a>
      </div>
    </header>

    <div className="page-grid">
      <aside className="sidebar" aria-label="Feed navigation">
        <nav className="primary-nav" aria-label="Primary"><NavLinks view={view} savedCount={saved.length} onAbout={openAbout} /></nav>
        <div className="sidebar-topics">
          <h2>Explore the ecosystem</h2>
          {topics.filter(t => t !== 'All').map(value => {
            const Icon = topicIcons[value]
            return <button key={value} className={`sidebar-topic${topic === value ? ' selected' : ''}`} onClick={() => chooseTopic(value)}><Icon size={18} /><span>{value}</span><span className="topic-total">{tweets.filter(tweet => tweet.topic === value).length}</span></button>
          })}
        </div>
        <div className="sidebar-bottom"><div className="sidebar-signature"><Leaf size={24} /><p>Good ideas grow<br />in good company.</p></div><a className="subtle-link" href="https://imd.fun" target="_blank" rel="noreferrer">Meet Identity MD<ArrowUpRight size={15} /></a><span className="community-note">An independent community feed.</span></div>
      </aside>

      <main id="main-content" tabIndex={-1}>
        <nav className="mobile-nav" aria-label="Primary"><NavLinks view={view} savedCount={saved.length} onAbout={openAbout} /></nav>
        <section className={`intro${view === 'saved' ? ' saved-intro' : ''}`} aria-labelledby="page-title">
          <div className="intro-copy">
            <h1 id="page-title">{view === 'saved' ? <>Good signal.<br /><span>Kept close.</span></> : <>Signal from<br /><span>the swarm.</span></>}</h1>
            <p>{view === 'saved' ? 'Your saved Identity MD tweets, in this browser.' : 'The top tweets about Identity MD.'}</p>
            <a className="primary-button" href="#tweets" onClick={event => { event.preventDefault(); feedRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); searchRef.current?.focus({ preventScroll: true }) }}>{view === 'saved' ? 'Explore saved tweets' : 'Explore tweets'}<ArrowDown size={16} /></a>
          </div>
          <img className="hero-pepe" src="./images/ai-pepe.webp" alt="Pepe equipped with a robotic arm, AI chip, and companion drone." width="768" height="512" fetchPriority="high" />
        </section>

        <section className="feed-section" id="tweets" ref={feedRef} aria-label={view === 'saved' ? 'Saved tweets' : 'Identity MD tweets'}>
          <div className="feed-toolbar">
            <div className="feed-modes" aria-label="Tweet order">
              <button className={`mode-button${order !== 'latest' ? ' mode-active' : ''}`} aria-pressed={order !== 'latest'} onClick={() => setOrder('likes')}><Flame size={18} />{view === 'saved' ? 'Saved tweets' : 'Top tweets'}</button>
              <button className={`mode-button${order === 'latest' ? ' mode-active' : ''}`} aria-pressed={order === 'latest'} onClick={() => setOrder('latest')}><Sparkles size={17} />Latest</button>
            </div>
            <div className="sort-control"><SlidersHorizontal size={15} /><label className="sr-only" htmlFor="sort-order">Sort tweets</label><select id="sort-order" value={order} onChange={event => setOrder(event.target.value as Order)}><option value="likes">Most liked</option><option value="latest">Newest first</option><option value="reposts">Most reposted</option><option value="views">Most viewed</option></select><ChevronDown className="select-chevron" size={14} /></div>
          </div>

          <div className="search-row"><div className="search-field"><label htmlFor="tweet-search">Search tweets</label><div className="search-input-wrap"><Search size={18} /><input ref={searchRef} id="tweet-search" type="search" name="tweet-search" autoComplete="off" placeholder="Try agents, hackathon, or @taylor_" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setQuery('') }} />{query ? <button className="clear-search icon-button" onClick={() => { setQuery(''); searchRef.current?.focus() }} aria-label="Clear search"><X size={17} /></button> : <kbd aria-hidden="true">/</kbd>}</div></div><div className="date-field"><label htmlFor="tweet-month">Date</label><div className="date-select-wrap"><select id="tweet-month" value={month} onChange={event => setMonth(event.target.value)}><option value="all">All dates</option><option value="2026-10">Oct 2026</option><option value="2026-09">Sep 2026</option></select><ChevronDown size={15} /></div></div></div>

          <div className="topic-filters" role="group" aria-label="Filter by topic">{topics.map(value => <button className={`filter-button${topic === value ? ' filter-active' : ''}`} key={value} aria-pressed={topic === value} onClick={() => setTopic(value)}>{value === 'All' && <Compass size={15} />}{value === 'All' ? 'All topics' : value}</button>)}</div>
          <div className="feed-meta"><span role="status" aria-live="polite">{results.length} {results.length === 1 ? 'tweet' : 'tweets'}{view === 'saved' ? ' saved' : ' in the pond'}</span><button className="snapshot-info" onClick={openAbout} title={`Captured ${fullDate(capturedAt)}. About the sources and ranking.`}><span className="snapshot-dot" />{shortDate(capturedAt)} 2026 snapshot<CircleHelp size={13} /></button></div>

          <div className="tweet-list">
            {results.map(tweet => <TweetCard key={tweet.id} tweet={tweet} saved={saved.includes(tweet.id)} copied={copiedId === tweet.id} onSave={saveTweet} onCopy={copyTweet} />)}
            {results.length === 0 && <div className="empty-state"><div className="empty-icon">{view === 'saved' && !filtersActive ? <Bookmark size={28} /> : <Search size={28} />}</div><h2>{view === 'saved' && !filtersActive ? 'Keep a little signal.' : 'No tweets found.'}</h2><p>{view === 'saved' && !filtersActive ? 'Save a tweet with its bookmark button. It will be waiting here in this browser.' : query ? `No matches for “${query}” with these filters.` : 'No tweets match these topic and date filters.'}</p>{filtersActive ? <button className="secondary-button" onClick={clearFilters}>Clear filters<ArrowRight size={16} /></button> : <a className="secondary-button" href="#feed">Explore the feed<ArrowRight size={16} /></a>}</div>}
          </div>
          {results.length > 0 && <div className="feed-end"><Leaf size={20} /><p>You’re all caught up with this snapshot.</p><a href={X_SEARCH} target="_blank" rel="noreferrer">Find more on X<ArrowUpRight size={15} /></a></div>}
        </section>
        <footer className="mobile-footer"><span>Made for the Identity MD community.</span><button onClick={openAbout}>Sources & about</button></footer>
      </main>

      <aside className="right-rail" aria-label="About the Identity MD community">
        <section className="pond-note"><div className="note-top"><span className="note-symbol"><Cpu size={20} /></span><span>Human curiosity. AI firepower.</span></div><h2>Small frogs.<br />Big possibilities.</h2><p>A front-row seat to what the<br className="desktop-break" /> Identity MD community is building.</p><a href="https://imd.fun" target="_blank" rel="noreferrer">Explore Identity MD<ArrowUpRight size={16} /></a><div className="note-drawing" aria-hidden="true"><svg viewBox="0 0 280 100" fill="none"><path d="M0 72h36l20-28h38l18 33h39l27-56h30l20 35h52" stroke="currentColor" strokeWidth="1.5"/><path d="M0 89h70l21-28h44l26 27h35l16-48h68" stroke="currentColor" strokeWidth="1.5" opacity=".3"/><circle cx="178" cy="21" r="4" fill="currentColor"/><circle cx="56" cy="44" r="4" fill="currentColor"/><rect x="211" y="4" width="32" height="32" rx="9" fill="#213c29" stroke="currentColor"/><path d="m220 20 5-5m-5 5 5 5m9-10-5 10" stroke="currentColor" strokeWidth="1.5"/></svg></div></section>
        <section className="rail-section"><div className="section-heading"><h2>In the conversation</h2><Compass size={18} /></div><div className="conversation-topics">{topics.filter(t => t !== 'All').map(value => <button className="conversation-topic" key={value} onClick={() => chooseTopic(value)}><div><strong>{value}</strong><span>{topicDescriptions[value as keyof typeof topicDescriptions]}</span></div><span className="conversation-count">{tweets.filter(tweet => tweet.topic === value).length}<ArrowUpRight size={15} /></span></button>)}</div></section>
        <section className="rail-section voices-section"><div className="section-heading"><h2>Voices in the pond</h2><Users size={18} /></div><div className="voice-list">{voices.map(author => <a className="voice-row" key={author.handle} href={`https://x.com/${author.handle}`} target="_blank" rel="noreferrer" aria-label={`View ${author.name} on X (opens in a new tab)`}><span className="avatar-link"><Avatar name={author.name} src={author.avatar} small /></span><span className="voice-name"><strong>{author.name}</strong><span>@{author.handle}</span></span><ArrowUpRight size={16} /></a>)}</div></section>
        <div className="rail-foot"><p>Excerpts, original links, and a little context.<br />Counts captured {shortDate(capturedAt)} 2026.</p><button onClick={openAbout}>How this feed works<ArrowUpRight size={14} /></button><span>For the community, by the pond.</span></div>
      </aside>
    </div>

    <div className="announcement sr-only" role="status" aria-live="polite">{notice}</div>
    {notice && <div className="toast"><Check size={18} /><p>{notice}</p><button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16} /></button></div>}

    <dialog ref={aboutRef} className="modal" aria-labelledby="about-title" onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close() }}><div className="modal-inner"><form method="dialog"><button className="icon-button modal-close" aria-label="Close about the pond"><X size={22} /></button></form><FrogMark /><h2 id="about-title">A little context.</h2><p>The Pond is an independent reading room for the Identity MD community.</p><h3>Real tweets, a dated snapshot</h3><p>These {tweets.length} public tweets were captured on <time dateTime={capturedAt}>{fullDate(capturedAt)}</time> through the public FxTwitter API. Every card links to the original tweet on X. The feed does not update automatically.</p><h3>What “top” means here</h3><p>Top tweets are ranked by recorded likes within this selected set. This is a small collection, not a complete ranking of every Identity MD tweet. Change the sort to compare reposts, views, or dates.</p><h3>A little context, clearly labelled</h3><p>Card quotes are short verbatim excerpts. The muted text below each excerpt is an editorial summary. Engagement numbers are a snapshot of X, and reading or saving here does not change them.</p><h3>Saved in your browser</h3><p>Bookmarks stay on this browser and device. They are not synced to X. Clearing browser storage also clears them. No account is needed.</p><a className="secondary-button" href={X_SEARCH} target="_blank" rel="noreferrer">Explore the conversation on X<ArrowUpRight size={17} /></a></div></dialog>

    <dialog ref={copyRef} className="modal copy-modal" aria-labelledby="copy-title" onClose={() => setCopyFallback(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close() }}><div className="modal-inner"><form method="dialog"><button className="icon-button modal-close" aria-label="Close copy link"><X size={22} /></button></form><h2 id="copy-title">Copy this tweet link</h2><p>Automatic copying is unavailable. Select the link and use your device’s copy action.</p><label htmlFor="copy-url">Original tweet URL</label><input id="copy-url" readOnly value={copyFallback?.url ?? ''} onFocus={event => event.currentTarget.select()} /><a className="secondary-button" href={copyFallback?.url} target="_blank" rel="noreferrer">Open original tweet<ArrowUpRight size={16} /></a></div></dialog>
  </>
}

export default App
