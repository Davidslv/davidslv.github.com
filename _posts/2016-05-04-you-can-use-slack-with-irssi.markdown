---
layout: post
title:  "You can use slack with irssi"
date:   2016-05-04 16:05:00
categories: productivity
---

As you may know, Slack has been adopted by a considerable amount of companies and groups of people to keep in touch with each other.

If you use IRC, or still feel nostalgic about those golden days, you might have heard of [irssi](https://irssi.org){:target= "\_blank"} at some point.

A few days ago I discovered that it's possible to connect to slack with irssi

All you need to do is follow the instructions in `slack.com/account/gateways`

And if you want to add a connection and make it persistent is simple enough:

{% highlight text %}
/network add -nick <nickname> slack
/server add -auto -ssl -network slack <account>.irc.slack.com 6667 <password>
/save
{% endhighlight %}

Note: If you love emojis I'm afraid you will not see them
