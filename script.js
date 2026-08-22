const SUPABASE_URL = 'https://xonmoxxknvswqaqhztdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvbm1veHhrbnZzd3FhcWh6dGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODE0MjgsImV4cCI6MjEwMjk1NzQyOH0.zKcQIwWw2E4id4FxJFeVlFfeSLUIQzbQ3w2XK4ugcWQ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_KEY = 'stories_v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const SLIDE_MS = 3000;
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;
 
const storyBar = document.getElementById('storyBar');
const addBtn = document.getElementById('addBtn');
const fileInput = document.getElementById('fileInput');
const hint = document.getElementById('hint');
 
const viewer = document.getElementById('viewer');
const viewerImage = document.getElementById('viewerImage');
const progressRow = document.getElementById('progressRow');
const closeBtn = document.getElementById('closeBtn');
const tapLeft = document.getElementById('tapLeft');
const tapRight = document.getElementById('tapRight');
 
let currentIndex = 0;
let slideTimer = null;
let slideStart = 0;
let remainingOnPause = null;
let cachedStories = [];
const seenIds = new Set(JSON.parse(localStorage.getItem('seen_story_ids') || '[]'));
 
/* ---------- Fetching shared stories ---------- */
 
async function fetchStories() {
  const cutoff = new Date(Date.now() - DAY_MS).toISOString();
  const { data, error } = await supabaseClient
    .from('stories')
    .select('*')
    .gt('created_at', cutoff)
    .order('created_at', { ascending: true });
 
  if (error) {
    console.error('Could not load stories:', error);
    hint.textContent = 'Could not load stories — check your Supabase keys in script.js.';
    return [];
  }
  return data;
}
 
async function addStory(dataUrl, name) {
  const { error } = await supabaseClient.from('stories').insert({
    name: name || 'Story',
    image: dataUrl
  });
  if (error) {
    console.error('Could not add story:', error);
    alert('Could not upload story. Check the console / your Supabase setup.');
    return;
  }
  await renderStoryBar();
}
 
function markSeen(id) {
  seenIds.add(id);
  localStorage.setItem('seen_story_ids', JSON.stringify([...seenIds]));
}
 
/* ---------- Rendering the bar ---------- */
 
async function renderStoryBar() {
  const stories = await fetchStories();
  cachedStories = stories;
 
  storyBar.querySelectorAll('.story-thumb-item').forEach(el => el.remove());
 
  stories.forEach((story, index) => {
    const item = document.createElement('button');
    item.className = 'story-item story-thumb-item';
    item.setAttribute('aria-label', 'View story');
    item.dataset.index = index;
 
    const ring = document.createElement('span');
    ring.className = 'story-avatar story-thumb' + (seenIds.has(story.id) ? ' seen' : '');
 
    const inner = document.createElement('span');
    inner.className = 'story-thumb-inner';
    inner.style.backgroundImage = `url(${story.image})`;
    inner.style.display = 'block';
 
    const label = document.createElement('span');
    label.className = 'story-name';
    label.textContent = story.name;
 
    ring.appendChild(inner);
    item.appendChild(ring);
    item.appendChild(label);
    item.addEventListener('click', () => openViewer(index));
    storyBar.appendChild(item);
  });
}
 
/* ---------- Image upload + resize ---------- */
 
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const name = window.prompt('Name for this story (e.g. your username):', 'You');
  resizeImage(file, MAX_WIDTH, MAX_HEIGHT).then(dataUrl => {
    addStory(dataUrl, name);
  }).catch(err => {
    console.error('Could not process image', err);
  });
  fileInput.value = '';
});
 
addBtn.addEventListener('click', () => fileInput.click());
 
function resizeImage(file, maxW, maxH) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxW / width, maxH / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
 
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
 
/* ---------- Viewer ---------- */
 
function openViewer(index) {
  if (cachedStories.length === 0) return;
  currentIndex = index;
  buildProgressBars(cachedStories.length);
  viewer.hidden = false;
  showSlide(currentIndex);
}
 
function closeViewer() {
  clearTimeout(slideTimer);
  viewer.hidden = true;
  progressRow.innerHTML = '';
  renderStoryBar();
}
 
function buildProgressBars(count) {
  progressRow.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const track = document.createElement('div');
    track.className = 'progress-track';
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    track.appendChild(fill);
    progressRow.appendChild(track);
  }
}
 
function showSlide(index) {
  if (index < 0 || index >= cachedStories.length) {
    closeViewer();
    return;
  }
 
  currentIndex = index;
  const story = cachedStories[index];
  viewerImage.src = story.image;
  markSeen(story.id);
 
  const fills = progressRow.querySelectorAll('.progress-fill');
  fills.forEach((fill, i) => {
    fill.classList.remove('active');
    if (i < index) {
      fill.classList.add('filled');
      fill.style.width = '100%';
    } else {
      fill.classList.remove('filled');
      fill.style.width = '0%';
    }
  });
 
  clearTimeout(slideTimer);
  const activeFill = fills[index];
  requestAnimationFrame(() => {
    activeFill.classList.add('active');
    activeFill.style.transitionDuration = SLIDE_MS + 'ms';
    activeFill.style.width = '100%';
  });
 
  slideStart = Date.now();
  slideTimer = setTimeout(() => showSlide(index + 1), SLIDE_MS);
}
 
function pauseSlide() {
  clearTimeout(slideTimer);
  const fills = progressRow.querySelectorAll('.progress-fill');
  const activeFill = fills[currentIndex];
  if (!activeFill) return;
  const computed = getComputedStyle(activeFill).width;
  activeFill.style.transitionDuration = '0ms';
  activeFill.style.width = computed;
  remainingOnPause = SLIDE_MS - (Date.now() - slideStart);
}
 
function resumeSlide() {
  const fills = progressRow.querySelectorAll('.progress-fill');
  const activeFill = fills[currentIndex];
  if (!activeFill || remainingOnPause == null) return;
  const remaining = Math.max(remainingOnPause, 0);
  requestAnimationFrame(() => {
    activeFill.style.transitionDuration = remaining + 'ms';
    activeFill.style.width = '100%';
  });
  slideStart = Date.now() - (SLIDE_MS - remaining);
  slideTimer = setTimeout(() => showSlide(currentIndex + 1), remaining);
}
 
closeBtn.addEventListener('click', closeViewer);
tapLeft.addEventListener('click', () => showSlide(currentIndex - 1));
tapRight.addEventListener('click', () => showSlide(currentIndex + 1));
 
let holdTimer = null;
document.getElementById('viewerMediaWrap').addEventListener('pointerdown', () => {
  holdTimer = setTimeout(pauseSlide, 180);
});
document.getElementById('viewerMediaWrap').addEventListener('pointerup', () => {
  clearTimeout(holdTimer);
  if (remainingOnPause != null) {
    resumeSlide();
    remainingOnPause = null;
  }
});
 
let touchStartX = 0;
viewer.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
});
viewer.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 40) return;
  if (dx > 0) {
    showSlide(currentIndex - 1);
  } else {
    showSlide(currentIndex + 1);
  }
});
 
document.addEventListener('keydown', (e) => {
  if (viewer.hidden) return;
  if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
  if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
  if (e.key === 'Escape') closeViewer();
});
 
/* ---------- Init ---------- */
 
renderStoryBar();
setInterval(renderStoryBar, 60 * 1000); // re-sync with the shared table every minute
 