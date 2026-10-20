# Instagram auto-post (Minutes of Wow)

Every day at 12:00 PM IST, GitHub makes a new FormReady tip image from `posts.json`
and posts it to your Instagram. It runs on GitHub's free servers, so your computer can be off.

Test without posting anything:

    node autopost/run.mjs --dry --day 0     # creates autopost/out/post-0.png and prints the caption

## One-time setup (about 30 minutes)

### A. Check the Instagram account
1. Instagram app > Settings > Account type: must be **Business** or **Creator** (not Personal).
2. It must be linked to a **Facebook Page** (Settings > Linked accounts, or Page settings > Linked accounts).

### B. Create a Meta app and a token
1. Go to https://developers.facebook.com > My Apps > Create App > type **Business**.
2. Add the product **Instagram** (API setup with Facebook login) and connect your Facebook Page/Instagram account.
3. In the Graph API Explorer, pick your app, ask for permissions `instagram_basic`,
   `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, then generate a token.
4. Turn it into a long-lived token, then get the **Page access token** (a Page token made from a
   long-lived user token does not expire). Meta's guide: "Get long-lived tokens".
5. Find your **Instagram account ID** (digits): call `me/accounts?fields=instagram_business_account`.
6. While the app is in Development mode you can post to your own account without app review,
   as long as you are an admin/developer of the app.

NEVER paste the token in chat, in code or in a file you share. Only use it as a GitHub secret.

### C. Put the project on GitHub
1. Create a **public** GitHub repository (Instagram needs a public image link; the images are only
   the tip graphics, nothing private).
2. Upload this project folder to it.
3. Repository > Settings > Secrets and variables > Actions > New repository secret:
   - `IG_USER_ID`  = your Instagram account ID
   - `IG_ACCESS_TOKEN` = the Page access token
4. Repository > Actions > "Instagram daily post" > Run workflow, to try it once by hand.

## Changing the posts
Edit `posts.json` (title, body, caption, tags). The post of the day is chosen by the date and
rotates through the list, so add more posts to avoid repeats. Do not add claims you are not sure
about (exam dates, official sizes); wrong information can hurt your account.

## Good to know
- Instagram allows up to 100 API posts per day; this posts 1.
- If a post fails, the workflow shows a red mark in the Actions tab with the reason.
- Image text is English. Hindi needs a Hindi font installed on the GitHub runner.
- The Graph API version is set with `GRAPH_VERSION` (default v23.0); update it if Meta retires it.
