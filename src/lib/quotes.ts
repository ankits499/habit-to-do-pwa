export type Quote = { text: string; author?: string };

export const QUOTES: Quote[] = [
  { text: "We are what we repeatedly do.", author: "Aristotle" },
  { text: "Small daily improvements are the key to staggering long-term results." },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Discipline is choosing between what you want now and what you want most." },
  { text: "Every action you take is a vote for the type of person you wish to become." },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
  { text: "A little progress each day adds up to big results." },
  { text: "Consistency is what transforms average into excellence.", author: "Marcus Cole" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now." },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Habits are the compound interest of self-improvement." },
  { text: "What you do every day matters more than what you do once in a while." },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "One day or day one. You decide." },
  { text: "Slow progress is still progress." },
  { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson" },
  { text: "Do something today that your future self will thank you for." },
  { text: "It's not about being perfect. It's about not giving up." },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "You get in life what you have the courage to ask for." },
  { text: "Little by little, a little becomes a lot." },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Never underestimate the power of a small, consistent effort." },
  { text: "Your future is created by what you do today, not tomorrow." },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "Progress, not perfection." },
  { text: "The only bad workout is the one that didn't happen." },
  { text: "A goal without a plan is just a wish." },
  { text: "Done is better than perfect." },
  { text: "Every accomplishment starts with the decision to try." },
  { text: "Fall seven times, stand up eight.", author: "Japanese proverb" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "You are one decision away from a completely different life." },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Small steps every day." },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickQuote(seed: string, dateKey: string): Quote {
  const index = hashString(`${seed}:${dateKey}`) % QUOTES.length;
  return QUOTES[index];
}
