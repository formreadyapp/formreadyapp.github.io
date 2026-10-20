# Instagram auto-post (Minutes of Wow)

Every day at 12:00 PM IST, GitHub makes a new FormReady tip image from `posts.json`
and posts it to your Instagram. It runs on GitHub's free servers, so your computer can be off.

Test without posting anything:

    node autopost/run.mjs --dry --day 0     # creates autopost/out/post-0.png and prints the caption

## Setup (Instagram API with Instagram login)

1. developers.facebook.com > your app > Use cases > Instagram use case > Customize.
2. **Permissions and features:** add `instagram_business_basic` and `instagram_business_content_publish`.
3. **API setup with Instagram login > Generate access tokens:** add the Minutes of Wow account
   (log in to Instagram when asked, accept), then click **Generate token** and copy it.
   You must be an admin/developer/tester of the app. While the app is in Development mode, this
   works for your own account without app review.
4. GitHub repository > Settings > Secrets and variables > Actions > New repository secret:
   `IG_ACCESS_TOKEN` = the token. (`IG_USER_ID` is not needed; it is found from the token.)
5. Repository > Actions > "Instagram daily post" > Run workflow, to try it once by hand.

NEVER paste the token in chat, code or any shared file. Only use it as a GitHub secret.

## Token expiry
Tokens generated this way last about 60 days. Set a reminder for every 50 days: generate a new
token (step 3) and replace the `IG_ACCESS_TOKEN` secret. If posts start failing with an
"access token" error, this is the reason.

## Changing the posts
Edit `posts.json` (title, body, caption, tags). The post of the day is chosen by the date and
rotates through the list, so add more posts to avoid repeats. Do not add claims you are not sure
about (exam dates, official sizes); wrong information can hurt your account.

## Good to know
- Instagram allows up to 100 API posts per day; this posts 1.
- If a post fails, the workflow shows a red mark in the Actions tab with the reason.
- Image text is English. Hindi needs a Hindi font installed on the GitHub runner.
- The API version is set with `GRAPH_VERSION` (default v23.0); update it if Meta retires it.
- Using a Facebook Page token instead? Set `IG_API_HOST=graph.facebook.com` and `IG_USER_ID`.
