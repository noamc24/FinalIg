# FinalIg

New additions:
- Backend: `GET /api/posts/explore` returns a global explore feed (all posts, newest first).
- Backend: `POST /api/groups/create-from-following` creates a group that includes everyone the creator currently follows (plus the creator).
- Frontend: Feed page now has a Following/Explore switcher.
- Frontend: Messages page includes a "Create Group From Following" button which calls the new backend endpoint.
