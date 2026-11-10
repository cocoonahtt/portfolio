const profileDialog = document.querySelector('#profileDialog');
const dashboardDialog = document.querySelector('#dashboardDialog');
const feedbackDialog = document.querySelector('#feedbackDialog');
const profileForm = document.querySelector('#profileForm');
const profile = {
  name: 'David', confidence: 'Beginner', stage: 'First tastes',
  goal: 'Share care more fairly', time: 'Sunday morning',
  foodCulture: 'Chinese home cooking', minutes: '30'
};

function openProfile(forceEdit = false) {
  if (localStorage.getItem('papabiteProfile') && !forceEdit) dashboardDialog.showModal();
  else profileDialog.showModal();
}

document.querySelectorAll('[data-action="open-profile"]').forEach(button =>
  button.addEventListener('click', () => openProfile())
);
document.querySelectorAll('[data-action="edit-profile"]').forEach(button =>
  button.addEventListener('click', () => {
    if (dashboardDialog.open) dashboardDialog.close();
    profileDialog.showModal();
  })
);
document.querySelectorAll('[data-action="open-feedback"]').forEach(button =>
  button.addEventListener('click', () => {
    if (dashboardDialog.open) dashboardDialog.close();
    feedbackDialog.showModal();
  })
);
document.querySelector('.close-dashboard').addEventListener('click', () => dashboardDialog.close());
document.querySelector('.menu-button').addEventListener('click', () =>
  document.querySelector('.site-header').classList.toggle('menu-open')
);
document.querySelectorAll('.site-header nav a').forEach(link =>
  link.addEventListener('click', () => document.querySelector('.site-header').classList.remove('menu-open'))
);

document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.choice;
  document.querySelectorAll(`[data-choice="${key}"]`).forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  profile[key] = button.dataset.value;
  updateLiveSummary();
}));

const minutes = document.querySelector('[name="minutes"]');
minutes.addEventListener('input', () => {
  document.querySelector('#minutesOutput').textContent = `${minutes.value} minutes`;
  profile.minutes = minutes.value;
});

function updateLiveSummary() {
  const name = profileForm.elements.name.value || 'Your name';
  const stage = profileForm.elements.stageSelect.value;
  const goal = profileForm.elements.goalSelect.value;
  const food = profileForm.elements.foodCulture.value || 'Your family meals';
  document.querySelector('#summaryName').textContent = name;
  document.querySelector('#summaryTime').textContent = profile.time;
  document.querySelector('#summaryConfidence').textContent = profile.confidence;
  document.querySelector('#summaryStage').textContent = stage;
  document.querySelector('#summaryGoal').textContent = goal;
  document.querySelector('#summaryFood').textContent = food;
}

['name', 'stageSelect', 'goalSelect', 'foodCulture'].forEach(name =>
  profileForm.elements[name].addEventListener('input', updateLiveSummary)
);

profileForm.addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(profileForm).entries());
  Object.assign(profile, values, {
    stage: profileForm.elements.stageSelect.value,
    goal: profileForm.elements.goalSelect.value,
    minutes: minutes.value
  });
  localStorage.setItem('papabiteProfile', JSON.stringify(profile));
  populateDashboard();
  profileDialog.close();
  dashboardDialog.showModal();
  showPanel('downloads');
});

function populateDashboard() {
  const saved = JSON.parse(localStorage.getItem('papabiteProfile') || '{}');
  Object.assign(profile, saved);
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = profile.name || 'David');
  document.querySelectorAll('[data-plan-time]').forEach(el => el.textContent = el.closest('.personal-tags') ? `${profile.minutes || 30}-minute challenges` : `${profile.minutes || 30} mins`);
  document.querySelectorAll('[data-plan-stage]').forEach(el => el.textContent = profile.stage || 'First tastes');
  document.querySelectorAll('[data-plan-rhythm]').forEach(el => el.textContent = profile.time || 'Sunday morning');
  document.querySelectorAll('[data-plan-goal]').forEach(el => el.textContent = profile.goal || 'Share care more fairly');
  document.querySelector('.nav-cta').textContent = saved.name ? 'My PapaBite' : 'Create my profile';
}

function showPanel(id) {
  document.querySelectorAll('aside [data-panel]').forEach(button => button.classList.toggle('active', button.dataset.panel === id));
  document.querySelectorAll('.dash-panel').forEach(panel => panel.classList.toggle('active', panel.id === id));
}
document.querySelectorAll('aside [data-panel]').forEach(button =>
  button.addEventListener('click', () => showPanel(button.dataset.panel))
);

document.querySelectorAll('.rating button, .feedback-question button').forEach(button => button.addEventListener('click', () => {
  const group = button.parentElement;
  group.querySelectorAll('button').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
}));
document.querySelector('#feedbackForm').addEventListener('submit', event => {
  event.preventDefault(); feedbackDialog.close(); showToast('Thank you — your real experience matters.');
});
document.querySelector('#inlineFeedback').addEventListener('submit', event => {
  event.preventDefault(); showToast('Feedback submitted — thank you for being honest.');
});

function showToast(message) {
  const toast = document.querySelector('.toast');
  toast.textContent = message; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('visible');
}), { threshold: .1 });
document.querySelectorAll('.reveal,.steps article,.tool-card').forEach(el => observer.observe(el));

populateDashboard();
updateLiveSummary();
