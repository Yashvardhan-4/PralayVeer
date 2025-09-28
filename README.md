# PralayVeer

Frontend (Admin + Student) disaster readiness & drill gamification interface.

Repository: https://github.com/Yashvardhan-4/PralayVeer

<!-- Netlify deploy badge (add once site is linked) -->
<!-- Example after linking:
[![Netlify Status](https://api.netlify.com/api/v1/badges/ YOUR_SITE_ID /deploy-status)](https://app.netlify.com/sites/YOUR_SITE_NAME/deploys)
-->

## Structure
- `index.html` Admin portal (auth + dashboard)
- `student_app.html` Student experience (streaks, quizzes, drills, avatar)
- `app.js` Admin logic (Firebase, drills, charts)
- `student_app.js` Student logic (gamification, profile slide-over, Firebase)
- `style.css` Admin styles
- `student_style.css` Student styles

## Netlify Deployment
No build step required (pure static). Two quick options:

### 1. Drag & Drop (fastest)
1. Zip the project folder contents (not the parent directory).
2. Visit https://app.netlify.com/drop
3. Drop the zip. Done.

### 2. Netlify CLI (recommended for updates)
Install once:
```
npm install -g netlify-cli
```
Login & deploy:
```
netlify login
netlify init   # create & link a new site (pick 'No build command')
netlify deploy --prod
```

The CLI will detect `netlify.toml`:
```
[build]
  publish = "."
```

## Optional Route Mapping
If you want `/student` instead of `/student_app.html` uncomment the redirect block in `netlify.toml`.

## Firebase Security (summary)
Ensure Firestore & Storage rules restrict writes to authenticated users. Avoid leaving wide-open test rules when sharing the URL.

## Next Enhancements
- Add service worker for offline drills
- Esc key + focus trap in profile slide-over
- Dark mode toggle

## Contributing
For now this is a closed prototype; if collaborators are added:
1. Create a feature branch: `feat/<short-topic>`
2. Keep commits atomic (present tense): `feat: add streak toast animation`
3. Open a Pull Request with a concise summary & screenshot / GIF.

Planned files (not yet added):
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/pull_request_template.md`

## License
Internal prototype (add proper license if open-sourcing).
