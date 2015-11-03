---
layout: post
title:  "Improve your attention to detail"
date:   2015-11-03 11:10:00
categories: professional life
tags: [development, professional, professional life]
---

Nowadays Front End Software Engineers face several challenges, they have to tackle the considerable amount of different devices with different screen sizes and resolutions,
even though there's plenty of CSS frameworks out there to ease this problem, you still need to know your way around.
You need to pay attention to detail, sometimes a small mistake is all it takes to ruin your work presentation.

Recently I built a website that needs to be compatible with mobile devices, so I took the opportunity to re-visit Twitter Bootstrap CSS framework, the project was small but challenging enough and I knew exactly how I would like to tackle it.

I had mobile first in mind, although my first mistake was to be using the browser window resized to accomplish this, so something like `col-md-4` seemed great to me. Soon I understood that something wasn't quite right, I knew that mobile wasn't a priority for this project, so I didn't let it slow me down and I focused on having the website ready as soon as possible.

When I finished it, I decided to investigate how broken the mobile version was, and oh boy… it was bad, but just aesthetically, elements were not quite in the right position, but that was fixable. I decided it was time to bring in the right tools!

I started by going back to Twitter Bootstrap documentation and re-read it to make sure I wasn't missing something, and I soon realised that I should move anything `col-md-*` to `col-sm-*` so the elements start by looking the same, even on iPhone. At this time I was using [Chrome DevTools](https://developer.chrome.com/devtools){:target="\_blank"} which allows you to simulate different devices, in different positions (portrait/landscape). It even allows you to simulate the network speed, and allows you to do a bunch of other things that I suspect you know about already.

Although this helped, it was not enough to tackle all the issues, as I soon noticed when on my iPhone 6 there was one element that was out of position, for no apparent reason even though DevTools was showing everything as I intended. So now I had an issue I couldn't reproduce on my laptop but it was happening on my iPhone… I thought how do I tackle this?

The answer was simple, if you have Xcode installed with the iPhone Simulator you can open Safari and use it as long as the website is not only local, once you are in the website, you need to open **Safari**, go to **Preferences**, **Advanced** and check the box saying “**Show Develop menu in menu bar**”. Now go to **Safari** and under **Develop** you will find **iOS Simulator**, open the page that you want to run Safari Web Inspector – it works similar to [Chrome DevTools](https://developer.chrome.com/devtools){:target="\_blank"}.

In under 10 minutes I had identified the problem. Since I was playing with the simulator and Safari Web Inspector, I took sometime to understand the time it was taking to load the website. I managed to find that an image was too big and was delayed the page loading by 3 seconds.
If you need some more information about how to set it up you, read this [quick tip](http://webdesign.tutsplus.com/articles/quick-tip-using-web-inspector-to-debug-mobile-safari--webdesign-8787){:target="\_blank"}.


## Conclusion

Attention to detail is key in any profession, knowing and using the right tools helps you to have visibility beyond your
thinking and helps you fix those small details that make all the difference.
In the future, it's worth having a check list of things you need to do and that you can also double check, like airline pilots do before a flight.

Thank you for reading.

David Silva
