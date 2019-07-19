# Meet Edna

Smart, reliable in-app feature announcements modal library

![](https://d1jfzjx68gj8xs.cloudfront.net/items/1I1p1o2o0L0T2A0v1R19/Image%202019-07-19%20at%202.44.37%20PM.jpg)

_My daughter's interpretation of Edna as a mascot_

## Highlights

**Prevents Logged In Users From Seeing the Same Modal Twice**

This library leverages redundant methods (localstorage & Google Cloud Functions + Firebase Realtime Database) to ensure that the same user never sees the same message twice.

**Built-in segmentation**

Use segmentation rules to ensure that only the right customers see your in-app message.

**Queue Up Multiple Messages, Without Annoying Users**

You can queue up multiple messages at the same time. Only one will be shown at a time with a one hour buffer between messages.

**Simple JS API**

`EDNA.messagePrevent()` can be called from anywhere to prevent Edna from displaying messages on a given screen. `EDNA.messageHide()` can also be called to programmatically hide a message that is showing.

## Demo

Here's a [demo of Edna in action](https://meetedna.firebaseapp.com/). Keep in mind, each of the blocks (header, paragraph text, image, and button are customizable).

For this demo, since duplicate views are blocked at the server level, there is some temporary code at the top of the page which simulates the user ID for a logged in user. 

Manually deleting the localstorage values for `_edna-t` and `_edna-s` will show how messages are still blocked with just the users ID present. This way logged in users will never see a message twice, even if they clear their local storage, or log in from a different machine.

## Installation

You don't really need to clone this repo (which contains demo files) to get things set up on your own server. Instead, I'd recommend the following:

**1) Grab a copy of the JS library**

Grab [this JS file](https://github.com/davemart-in/meetedna/blob/master/public/js/edna-embed-0.1.js) and move it to your own server. Note: You'll want to update the `YOUR-ACCOUNT-HERE` string on [this line](https://github.com/davemart-in/meetedna/blob/master/public/js/edna-embed-0.1.js#L273) with the name of your firebase project once you have it (more on that below).

**2) Grab the base CSS**

Grab a copy of [this CSS file](https://github.com/davemart-in/meetedna/blob/master/public/css/style.css) and move it to your server. Don't forget to [update the reference](https://github.com/davemart-in/meetedna/blob/master/public/js/edna-embed-0.1.js#L138) to this CSS file.

**3) Create a Google Firebase account**

- [Create an account](https://firebase.google.com/) if you don't have one already. 
- Then walk through the process of setting up a new project
- You'll need to opt into the "Blaze" plan and add a credit card in order to use HTTP cloud functions
- You'll want to create a new Real-time Database within this new project (note: not Firestore). This is how we'll track which users have seen which messages.
- Set your Real-time Database Rules so that no one other than you can access your DB. Here's what they should look like:
```
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

**3) Set up cloud functions locally**

If you've never set up Cloud Functions before, it's pretty straight forward. Here are the [official step-by-step instructions](https://firebase.google.com/docs/functions/get-started). To summarize, within Terminal you:

- Create a new folder locally
- Change directories into that folder
- Set up Firebase CLI by running `npm install -g firebase-tools`
- Authenticate by running `firebase login`
- Run `firebase init functions` to scaffold the functions folder and install dependancies
- Then copy the cloud function from [here](https://github.com/davemart-in/meetedna/blob/master/functions/index.js) and paste the contents into `/functions/index.js`. Again, make sure you replace the `YOUR-ACCOUNT-HERE` string with the name of your Firebase project. Save your changes.
- Then run 'firebase deploy --only functions' to sync your new function to Google's servers. Any time you make changes to `index.js` you'll need to re-run this command.

Note: The Firebase Cloud Functions [log section](https://cl.ly/5c0b4acc5fc6) comes in handy if you ever need to troubleshoot something going wrong with your cloud functions. If you `console.log()` something in a function, it will show up here.

**4) Include the Edna embed within the page(s) where you want your message displayed**

We'll go over this in detail in the section below. 

Here's the [config JSON](https://github.com/davemart-in/meetedna/blob/master/public/index.html#L21) for the demo that is shown in the section above.

## Configuration

### Example Configuration

The following code, when embedded in your app would trigger a modal with an image/header/text/button to be seen by all "administrator"'s' within URL's that contain "firebaseapp.com":

```
<script>
  // START Edna
  window.ednaSettings = {
    "messages": [
      {
        "blocks": [
          {
            "order": 0,
            "type": "imageCentered",
            "value": "img/illo.svg"
          },
          {
            "order": 1,
            "type": "header",
            "value": "Header Text"
          },
          {
            "order": 2,
            "type": "text",
            "value": "Paragraph text"
          },
          {
            "link": "http://example.net",
            "order": 3,
            "type": "button",
            "value": "Learn More"
          }
        ],
        "key": "earn-section", // Unique ID for each message, lower case letters and '-' only
        "priority": 1, // Lower the integer, the higher the priortity
        "segmentation": [
          {
            "condition": "contains",
            "key": "url",
            "value": "firebaseapp.com"
          },
          {
            "condition": "equals",
            "key": "role",
            "value": "administrator"
          },
        ]
      }
    ],
    "user": {
      "id": userId,
      "role": "administrator"
    }
  };
  (function(){var d=document;var w=window;function l(){var s = d.createElement('script');s.type='text/javascript';s.async=true;s.src='js/edna-embed-0.1.js';x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);}if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}})();
  // END Edna
</script>
```

`ednaSettings` has two parts, a messages array, and a user object.

### messages array

Within the messages array we have one or more message objects. Within each message object we have blocks, key, prioritization and segmentation data.

#### blocks

Blocks make up the content that you see within a message. The following blocks are available:

**button**

button takes a `value` string for the button text, a `link` string for the URL that users should be taken to onclick, and an `order` integer to determine what order this block is shown in.

```
{
  "link": "http://example.net",
  "order": 1,
  "type": "button",
  "value": "Learn More"
}
```

**header**

header takes a `value` string for the header text and an `order` integer to determine what order this block is shown in.

```
{
  "order": 1,
  "type": "header",
  "value": "Header Text"
}
```

**imageCentered**

imageCentered takes a `value` string for the centered image URL and an `order` integer to determine what order this block is shown in.

```
{
  "order": 1,
  "type": "imageCentered",
  "value": "/img/url.png"
}
```

**imageFull**

imageFull takes a `value` string for the full width image URL and an `order` integer to determine what order this block is shown in.

```
{
  "order": 1,
  "type": "imageFull",
  "value": "/img/url.png"
}
```

**text**

text takes a `value` string for the paragraph text and an `order` integer to determine what order this block is shown in.

```
{
  "order": 1,
  "type": "text",
  "value": "Paragraph text here."
}
```

**videoVimeo**

videoVimeo takes a `value` string for the Vimeo embed URL and an `order` integer to determine what order this block is shown in.

```
{
  "order": 1,
  "type": "videoVimeo",
  "value": "https://player.vimeo.com/video/44633289?app_id=122963"
}
```

**videoWistia**

videoWistia takes a `value` string for the Wistia embed URL and an `order` integer to determine what order this block is shown in.

```
{
  "order": 1,
  "type": "videoWistia",
  "value": "https://fast.wistia.com/embed/iframe/mqf9c9147u"
}
```

**videoYoutube**

videoYoutube takes a `value` string for the YouTube embed URL and an `order` integer to determine what order this block is shown in.

```
{
  "order": 1,
  "type": "videoYoutube",
  "value": "https://www.youtube.com/embed/_Oh12ROTQCE?feature=oembed"
}
```

#### key

The key is simply a unique ID used to differentiate one message from another within the Firebase Real-time DB. It's recommended to keep the key limited to lower case letters and hyphens "-".

#### prioritization

If there are multiple messages, the prioritization integrer determines which one should be shown first.

#### segmentation

The segmentation section allows you to determine exactly who sees a message and who shouldn't. Any user object key/value pair can be used in segmentation in addition to `url` which is [detected automattically](https://github.com/davemart-in/meetedna/blob/master/public/js/edna-embed-0.1.js#L14) within the library. Multiple segmentation rules can be combined for complex segmentation.

### user object

The user object consists of user specific data that you'd like to use along side segmentation rules.

**Example**

```
"user": {
  "id": userId,
  "role": "administrator"
}
```

`id` is required in order to prevent duplicate messages from being seen server side. `role` and any other key/value pair you want to add are optional. 

Note: From a privacy standpoint, on the user ID is passed to Google Cloud Functions.

## Intentionally left out of the v1

The following functionality was intentionally left out of the v1 of this library:

**CSS Refinements**

Color/font/padding/margin changes are not made programattically, but via CSS overrides.

**Visual Builder**

For the v1, there is no visual builder experience. To create a new modal, you'll need to manually assemble the various configuration variables (blocks, key, priority, segmentation) within `window.ednaSettings`

**Views Tracking**

I figure most companies will already have a preferred way of tracking things. I've [stubbed out a tracking function](https://github.com/davemart-in/meetedna/blob/master/public/js/edna-embed-0.1.js#L301) within the Edna library where you can add your own tracking code.
