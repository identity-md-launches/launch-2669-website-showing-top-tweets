import { ArrowUpRight, Bookmark, Check, Copy, Eye, Heart, MessageCircle, Repeat2 } from 'lucide-react'
import { compact, fullDate, shortDate } from '../data'
import type { Tweet } from '../data'

interface Props {
  tweet: Tweet
  saved: boolean
  copied: boolean
  onSave: (id: string) => void
  onCopy: (tweet: Tweet) => void
}

export function Avatar({ name, src, small = false }: { name: string; src: string; small?: boolean }) {
  return <img className={`avatar${small ? ' avatar-small' : ''}`} src={src} alt="" width={small ? 34 : 42} height={small ? 34 : 42} loading="lazy" onError={event => {
    event.currentTarget.hidden = true
    event.currentTarget.parentElement?.setAttribute('data-initial', name[0])
  }} />
}

export default function TweetCard({ tweet, saved, copied, onSave, onCopy }: Props) {
  return <article className="tweet-card" aria-label={`Tweet by ${tweet.author.name}`} data-tweet-id={tweet.id}>
    <div className="tweet-head">
      <a className="avatar-link" href={`https://x.com/${tweet.author.handle}`} target="_blank" rel="noreferrer" aria-label={`${tweet.author.name} on X (opens in a new tab)`}>
        <Avatar name={tweet.author.name} src={tweet.author.avatar} />
      </a>
      <div className="tweet-author">
        <a className="author-name" href={`https://x.com/${tweet.author.handle}`} target="_blank" rel="noreferrer">{tweet.author.name}</a>
        <span className="author-handle">@{tweet.author.handle}</span>
      </div>
      <time dateTime={tweet.publishedAt} title={fullDate(tweet.publishedAt)}>{shortDate(tweet.publishedAt)}</time>
      <button className={`icon-button save-button${saved ? ' is-saved' : ''}`} aria-label={`${saved ? 'Unsave' : 'Save'} tweet by ${tweet.author.name}`} aria-pressed={saved} title={saved ? 'Remove from saved tweets' : 'Save tweet'} onClick={() => onSave(tweet.id)}>
        <Bookmark size={19} fill={saved ? 'currentColor' : 'none'} />
      </button>
    </div>
    <div className="tweet-body">
      <blockquote cite={tweet.url}>{tweet.excerpt}</blockquote>
      <p className="tweet-summary">{tweet.summary}</p>
      <span className="topic-label"><span className={`topic-dot topic-${tweet.topic.toLowerCase()}`} />{tweet.topic}</span>
    </div>
    <div className="tweet-foot">
      <ul className="tweet-metrics" aria-label="Engagement at snapshot time">
        <li title={`${tweet.likes.toLocaleString()} likes`}><Heart size={16} /><span><span className="sr-only">Likes: </span>{compact(tweet.likes)}</span></li>
        <li title={`${tweet.reposts.toLocaleString()} reposts`}><Repeat2 size={16} /><span><span className="sr-only">Reposts: </span>{compact(tweet.reposts)}</span></li>
        <li className="reply-metric" title={`${tweet.replies.toLocaleString()} replies`}><MessageCircle size={16} /><span><span className="sr-only">Replies: </span>{compact(tweet.replies)}</span></li>
        <li className="view-metric" title={`${tweet.views?.toLocaleString() ?? 'Unknown'} views`}><Eye size={16} /><span><span className="sr-only">Views: </span>{tweet.views === null ? 'Unknown' : compact(tweet.views)}</span></li>
      </ul>
      <div className="tweet-actions">
        <button className="icon-button copy-button" onClick={() => onCopy(tweet)} aria-label={`Copy link to tweet by ${tweet.author.name}`} title={copied ? 'Link copied' : 'Copy tweet link'}>{copied ? <Check size={17} /> : <Copy size={17} />}</button>
        <a className="read-tweet" href={tweet.url} target="_blank" rel="noreferrer" aria-label={`Read tweet by ${tweet.author.name} on X (opens in a new tab)`}>Read tweet<ArrowUpRight size={16} /></a>
      </div>
    </div>
  </article>
}
