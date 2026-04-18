/**
 * Real Dogs — Story Worker (UAT)
 *
 * INITIAL SETUP (run once from the worker/ folder):
 *   wrangler kv namespace create STORIES
 *   → Copy the id it gives you into wrangler.toml under [[kv_namespaces]]
 *
 *   wrangler secret put ANTHROPIC_API_KEY
 *   wrangler secret put ADMIN_PASSWORD   ← pick any strong password for /admin.html
 *
 *   wrangler deploy
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// ─── Story style prompts ─────────────────────────────────────────────────────
const STYLES = {
  adventure_log: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word adventure log about a real dog.
Style: energetic travel-blog, third person, vivid and fun. Focus on their adventures and personality.
Use the dog's name throughout. End on a warm, uplifting note.
Write ONLY the story — no title, no heading, no preamble.`
  },
  origin_story: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word origin story about a real dog.
Style: heartwarming and emotional. Start from how they came to their family; build to the life they share today.
Use the dog's name throughout. End with what makes this dog irreplaceable.
Write ONLY the story — no title, no heading, no preamble.`
  },
  day_in_my_life: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word "day in my life" in first-person from the dog's point of view.
Style: funny, playful, enthusiastic. The dog narrates their day with personality and humour.
Dogs are dramatic, food-obsessed, deeply loyal. Use the dog's name when they refer to themselves.
Write ONLY the story — no title, no heading, no preamble.`
  },
  the_legend: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word tall-tale legend about a real dog.
Style: mythic, epic, wonderfully over-the-top — like Paul Bunyan but for a dog. Playfully exaggerate.
Use the dog's name throughout. End with a memorable legendary declaration.
Write ONLY the story — no title, no heading, no preamble.`
  },
  best_friend: {
    system: `You are a skilled writer for a real dog website. Write a 250–400 word best-friend story.
Style: warm, nostalgic, heartfelt — told from the owner's perspective. Focus on the bond and small everyday moments.
Use the dog's name throughout. End with a reflection on what life would look like without them.
Write ONLY the story — no title, no heading, no preamble.`
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function resp(body, status = 200, extra = {}) {
  return new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    { status, headers: { 'Content-Type': 'application/json', ...CORS, ...extra } }
  );
}

function makeSlug(name) {
  const base = (name || 'dog')
    .toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20).replace(/-$/, '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${rand}`;
}

function isAuthed(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_PASSWORD}`;
}

function excerpt(text, len = 160) {
  if (!text || text.length <= len) return text;
  return text.slice(0, len).replace(/\s\S*$/, '') + '…';
}

function extractBase64(dataUrl) {
  const m = dataUrl?.match(/^data:([a-zA-Z0-9+/.-]+);base64,(.+)$/);
  return m ? { mediaType: m[1], data: m[2] } : null;
}

// ─── Build Claude prompt ─────────────────────────────────────────────────────
function buildPrompt(d) {
  const personalityFull = [...(d.personality || []), ...(d.personalityExtra ? [d.personalityExtra] : [])];
  const activitiesFull  = [...(d.activities  || []), ...(d.activitiesExtra  ? [d.activitiesExtra]  : [])];
  const treatsFull      = [...(d.treats       || []), ...(d.treatsExtra       ? [d.treatsExtra]       : [])];
  const adventuresFull  = [...(d.adventures   || []), ...(d.adventuresExtra   ? [d.adventuresExtra]   : [])];

  return 'Write the story using these details:\n\n' + [
    `Dog's name: ${d.dogName || 'Unknown'}`,
    d.dogBreed        ? `Breed: ${d.dogBreed}` : null,
    d.age             ? `Age: ${d.age}` : null,
    d.sex             ? `Sex: ${d.sex}` : null,
    d.origin          ? `How they came to their family: ${d.origin}` : null,
    d.location        ? `Where they're from: ${d.location}` : null,
    d.originStory     ? `Background: ${d.originStory}` : null,
    personalityFull.length ? `Personality: ${personalityFull.join(', ')}` : null,
    activitiesFull.length  ? `Favourite activities: ${activitiesFull.join(', ')}` : null,
    treatsFull.length      ? `Favourite foods/treats: ${treatsFull.join(', ')}` : null,
    d.friends?.length      ? `Best friends: ${d.friends.join(', ')}` : null,
    d.friendNames     ? `Friend names: ${d.friendNames}` : null,
    adventuresFull.length  ? `Greatest adventures: ${adventuresFull.join(', ')}` : null,
    d.funnyHabit      ? `Funniest habit: ${d.funnyHabit}` : null,
    d.specialTalent   ? `Special talent: ${d.specialTalent}` : null,
    d.extraDetails    ? `Extra detail: ${d.extraDetails}` : null,
  ].filter(Boolean).join('\n');
}

// ─── Route: POST /generate ───────────────────────────────────────────────────
async function handleGenerate(request, env) {
  const body = await request.json();
  const { storyStyle, photos = [] } = body;
  const styleConfig = STYLES[storyStyle] || STYLES.adventure_log;

  const content = [];
  for (const dataUrl of photos.slice(0, 3)) {
    const img = extractBase64(dataUrl);
    if (img) content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } });
  }
  content.push({ type: 'text', text: buildPrompt(body) });
  if (photos.length > 0) {
    content.push({ type: 'text', text: "Reference the dog's appearance (colour, coat, size, expression) from the photos to make the story vivid." });
  }

  const apiRes = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 900, system: styleConfig.system, messages: [{ role: 'user', content }] })
  });

  if (!apiRes.ok) {
    const err = await apiRes.text();
    console.error('Anthropic error:', apiRes.status, err);
    const isAuth = apiRes.status === 401;
    return resp({ error: isAuth ? 'invalid_api_key' : 'generation_failed' }, 502);
  }

  const result = await apiRes.json();
  return resp({ story: result.content?.[0]?.text ?? '' });
}

// ─── Route: POST /submit ─────────────────────────────────────────────────────
async function handleSubmit(request, env) {
  const body = await request.json();
  const { dogName, story, storyStyle, email, phone, instagram, photos = [], ...formData } = body;

  if (!story || !dogName) return resp({ error: 'missing_fields' }, 400);

  const slug = makeSlug(dogName);
  const record = {
    id: slug,
    slug,
    dogName,
    story,
    storyStyle: storyStyle || 'adventure_log',
    excerpt: excerpt(story),
    email: email || '',
    phone: phone || '',
    instagram: instagram || '',
    photos,             // full photos array
    firstPhoto: photos[0] || null,
    formData,
    status: 'pending',
    createdAt: new Date().toISOString(),
    approvedAt: null,
  };

  await env.STORIES.put(`story:${slug}`, JSON.stringify(record));
  return resp({ id: slug, slug });
}

// ─── Route: GET /gallery ─────────────────────────────────────────────────────
async function handleGallery(env) {
  const list = await env.STORIES.list({ prefix: 'story:' });
  const stories = [];

  for (const key of list.keys) {
    const raw = await env.STORIES.get(key.name);
    if (!raw) continue;
    const s = JSON.parse(raw);
    if (s.status !== 'approved') continue;
    // Return metadata + first photo only (not full photos array)
    stories.push({
      id: s.id, slug: s.slug, dogName: s.dogName,
      storyStyle: s.storyStyle, excerpt: s.excerpt,
      firstPhoto: s.firstPhoto, instagram: s.instagram,
      approvedAt: s.approvedAt
    });
  }

  stories.sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));
  return resp({ stories });
}

// ─── Route: GET /story/:slug ─────────────────────────────────────────────────
async function handleStory(slug, env) {
  const raw = await env.STORIES.get(`story:${slug}`);
  if (!raw) return resp({ error: 'not_found' }, 404);
  const s = JSON.parse(raw);
  if (s.status !== 'approved') return resp({ error: 'not_published' }, 403);
  // Return everything except contact details
  const { email, phone, formData, ...pub } = s;
  return resp(pub);
}

// ─── Route: GET /admin/stories ───────────────────────────────────────────────
async function handleAdminList(request, env) {
  if (!isAuthed(request, env)) return resp({ error: 'unauthorized' }, 401);
  const list = await env.STORIES.list({ prefix: 'story:' });
  const stories = [];
  for (const key of list.keys) {
    const raw = await env.STORIES.get(key.name);
    if (!raw) continue;
    const s = JSON.parse(raw);
    const { photos, ...meta } = s;
    meta.firstPhoto = s.firstPhoto;
    stories.push(meta);
  }
  stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return resp({ stories });
}

// ─── Route: POST /admin/approve/:slug ────────────────────────────────────────
async function handleApprove(slug, request, env) {
  if (!isAuthed(request, env)) return resp({ error: 'unauthorized' }, 401);
  const raw = await env.STORIES.get(`story:${slug}`);
  if (!raw) return resp({ error: 'not_found' }, 404);
  const s = JSON.parse(raw);
  s.status = 'approved';
  s.approvedAt = new Date().toISOString();
  await env.STORIES.put(`story:${slug}`, JSON.stringify(s));
  return resp({ ok: true, slug });
}

// ─── Route: POST /admin/reject/:slug ─────────────────────────────────────────
async function handleReject(slug, request, env) {
  if (!isAuthed(request, env)) return resp({ error: 'unauthorized' }, 401);
  const raw = await env.STORIES.get(`story:${slug}`);
  if (!raw) return resp({ error: 'not_found' }, 404);
  const s = JSON.parse(raw);
  s.status = 'rejected';
  await env.STORIES.put(`story:${slug}`, JSON.stringify(s));
  return resp({ ok: true, slug });
}

// ─── Main fetch handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url    = new URL(request.url);
    const path   = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method;

    try {
      if (method === 'POST' && path === '/generate')             return handleGenerate(request, env);
      if (method === 'POST' && path === '/submit')               return handleSubmit(request, env);
      if (method === 'GET'  && path === '/gallery')              return handleGallery(env);
      if (method === 'GET'  && path.startsWith('/story/'))       return handleStory(path.slice(7), env);
      if (method === 'GET'  && path === '/admin/stories')        return handleAdminList(request, env);
      if (method === 'POST' && path.startsWith('/admin/approve/')) return handleApprove(path.slice(16), request, env);
      if (method === 'POST' && path.startsWith('/admin/reject/'))  return handleReject(path.slice(15), request, env);
      if (path === '/') return new Response('Real Dogs Worker ✓', { headers: CORS });
      return resp({ error: 'not_found' }, 404);
    } catch (err) {
      console.error(err);
      return resp({ error: 'internal_error' }, 500);
    }
  }
};
