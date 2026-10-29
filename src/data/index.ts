import snapshot from './tweets.json'

export type Topic = 'All' | 'Building' | 'Agents' | 'Culture'
export type View = 'feed' | 'saved'
export type Order = 'likes' | 'latest' | 'reposts' | 'views'
export interface Tweet {
  id: string
  url: string
  author: { name: string; handle: string; avatar: string }
  publishedAt: string
  topic: string
  excerpt: string
  summary: string
  likes: number
  reposts: number
  replies: number
  views: number | null
  source: string
}

export const tweets: Tweet[] = snapshot.tweets
export const capturedAt = snapshot.capturedAt
export const topics: Topic[] = ['All', 'Building', 'Agents', 'Culture']
export const X_SEARCH = 'https://x.com/search?q=%22identity%20md%22%20OR%20%22identity.md%22%20OR%20%24IMD&f=top'
export const shortDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value))
export const fullDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }).format(new Date(value))
export const compact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export function selectTweets({ query, topic, month, order, view, saved }: { query: string; topic: Topic; month: string; order: Order; view: View; saved: string[] }) {
  const q = query.trim().toLocaleLowerCase()
  return tweets.filter(tweet =>
    (view !== 'saved' || saved.includes(tweet.id)) &&
    (topic === 'All' || tweet.topic === topic) &&
    (month === 'all' || tweet.publishedAt.startsWith(month)) &&
    (!q || [tweet.excerpt, tweet.summary, tweet.author.name, `@${tweet.author.handle}`, tweet.topic].join(' ').toLocaleLowerCase().includes(q)),
  ).sort((a, b) => {
    const delta = order === 'latest' ? Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      : order === 'reposts' ? b.reposts - a.reposts
      : order === 'views' ? (b.views ?? -1) - (a.views ?? -1)
      : b.likes - a.likes
    return delta || Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  })
}
