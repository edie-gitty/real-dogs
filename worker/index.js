/**
 * Real Dogs — Story Generator Worker (UAT)
 * Cloudflare Worker that proxies story generation requests to the Anthropic API.
 *
 * SETUP (one-time, ~5 minutes):
 *  1. npm install -g wrangler
 *  2. wrangler login
 *  3. wrangler secret put ANTHROPIC_API_KEY   ← paste your Anthropic key when prompted
 *  4. wrangler deploy
 *
 * Copy the deployed worker URL into the WORKER_URL constant at the top of story.html.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const STYLES = {
  adventure_log: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word adventure log about a real dog.
Style: energetic travel-blog, third person, vivid and fun. Focus on their adventures and personality.
Use the dog's name throughout. End on a warm, uplifting note.
Write ONLY the story — no title, no heading, no preamble.`
  },
  origin_story: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word origin story about a real dog.
Style: heartwarming and emotional. Start from how the dog came to their family; build to the life they share today.
Use the dog's name throughout. End with what makes this dog irreplaceable.
Write ONLY the story — no title, no heading, no preamble.`
  },
  day_in_my_life: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word "day in my life" story in first-person from the dog's point of view.
Style: funny, playful, enthusiastic — the dog narrates their day with personality and humour.
Dogs are dramatic, food-obsessed, and deeply loyal in their own way. Use the dog's name when they refer to themselves.
Write ONLY the story — no title, no heading, no preamble.`
  },
  the_legend: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word tall-tale legend about a real dog.
Style: mythic, epic, wonderfully over-the-top — like Paul Bunyan but for a dog. Dramatically exaggerate their traits and adventures in a fun, clearly playful way.
Use the dog's name throughout. End with a memorable legendary declaration.
Write ONLY the story — no title, no heading, no preamble.`
  },
  best_friend: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word best-friend story about a dog.
Style: warm, nostalgic, heartfelt — told from the owner's perspective. Focus on the friendship, small everyday moments, and what makes this dog truly special.
Use the dog's name throughout. End with a reflection on what life would look like without them.
Write ONLY the story — no title, no heading, no preamble.`
  }
};

function buildPrompt(data) {
  const {
    dogName, dogBreed, age, sex, origin, location, originStory, postcode,
    personality, personalityExtra,
    activities, activitiesExtra,
    treats, treatsExtra,
    friends, friendNames,
    adventures, adventuresExtra,
    funnyHabit, specialTalent, extraDetails
  } = data;

  // Merge chip selections with free-text additions
  const personalityFull = [
    ...(personality || []),
    ...(personalityExtra ? [personalityExtra] : [])
  ];
  const activitiesFull = [
    ...(activities || []),
    ...(activitiesExtra ? [activitiesExtra] : [])
  ];
  const treatsFull = [
    ...(treats || []),
    ...(treatsExtra ? [treatsExtra] : [])
  ];
  const adventuresFull = [
    ...(adventures || []),
    ...(adventuresExtra ? [adventuresExtra] : [])
  ];

  const lines = [
    `Dog's name: ${dogName || 'Unknown'}`,
    dogBreed           ? `Breed: ${dogBreed}` : null,
    age                ? `Age: ${age}` : null,
    sex                ? `Sex: ${sex}` : null,
    origin             ? `How they came to their family: ${origin}` : null,
    location           ? `Where they're from: ${location}` : null,
    originStory        ? `Background story: ${originStory}` : null,
    postcode           ? `Based in postcode: ${postcode}` : null,
    personalityFull.length  ? `Personality: ${personalityFull.join(', ')}` : null,
    activitiesFull.length   ? `Favourite activities: ${activitiesFull.join(', ')}` : null,
    treatsFull.length       ? `Favourite treats/foods: ${treatsFull.join(', ')}` : null,
    friends?.length         ? `Best friends: ${friends.join(', ')}` : null,
    friendNames             ? `Friend names to include: ${friendNames}` : null,
    adventuresFull.length   ? `Greatest adventures: ${adventuresFull.join(', ')}` : null,
    funnyHabit         ? `Funniest habit: ${funnyHabit}` : null,
    specialTalent      ? `Special talent: ${specialTalent}` : null,
    extraDetails       ? `Extra detail from owner: ${extraDetails}` : null,
  ].filter(Boolean).join('\n');

  return `Write the story using these details about the dog:\n\n${lines}`;
}

function extractBase64(dataUrl) {
  const m = dataUrl.match(/^data:([a-zA-Z0-9+/.-]+);base64,(.+)$/);
  return m ? { mediaType: m[1], data: m[2] } : null;
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST')
      return new Response('Method not allowed', { status: 405, headers: cors });

    try {
      const body = await request.json();
      const { storyStyle, photos = [] } = body;

      const styleConfig = STYLES[storyStyle] || STYLES.adventure_log;
      const userText    = buildPrompt(body);

      // Images first — Claude sees them before reading the text prompt
      const content = [];
      for (const dataUrl of photos.slice(0, 3)) {
        const img = extractBase64(dataUrl);
        if (img) {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: img.mediaType, data: img.data }
          });
        }
      }

      content.push({ type: 'text', text: userText });

      if (photos.length > 0) {
        content.push({
          type: 'text',
          text: "Reference the dog's appearance (colour, coat, size, expression) from the photos to make the story feel personal and vivid."
        });
      }

      const apiRes = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-6',
          max_tokens: 900,
          system:     styleConfig.system,
          messages:   [{ role: 'user', content }]
        })
      });

      if (!apiRes.ok) {
        const err = await apiRes.text();
        console.error('Anthropic API error:', err);
        return json({ error: 'Story generation failed' }, 502, cors);
      }

      const result = await apiRes.json();
      const story  = result.content?.[0]?.text ?? '';

      return json({ story }, 200, cors);

    } catch (err) {
      console.error('Worker error:', err);
      return json({ error: 'Internal error' }, 500, cors);
    }
  }
};
