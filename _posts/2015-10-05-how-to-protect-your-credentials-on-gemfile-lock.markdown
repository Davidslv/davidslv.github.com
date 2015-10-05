---
layout: post
title:  "How to protect your credentials on Gemfile.lock"
date:   2015-10-05 22:40:00
categories: ruby development gemfile bundler credentials
---

As you might know, it's not a good idea to store any kind of credentials under your VCS (like git).

Although if you have some private gems you probably wrote this on your Gemfile:

{% highlight ruby %}

  source 'https://username:password@gemserver.com'

{% endhighlight %}

And then someone told you you should have the username and password stored in [Environment Variables](https://en.wikipedia.org/wiki/Environment_variable) so you went and assigned
the username and password to them and your Gemfile became like this:

{% highlight ruby %}

  source "https://#{ENV['USERNAME']}:#{ENV['PASSWORD']}@gemserver.com"

{% endhighlight %}

But... did you notice what happens when you run `bundle`?

Your Gemfile.lock now has the username and password written there, so much for the
environment variables right?

The bundler team heard your prayers and they actually [implemented something](http://bundler.io/man/bundle-config.1.html#CREDENTIALS-FOR-GEM-SOURCES) to solve this problem!

So all you need to do is go back to your Gemfile and remove the credentials from the url like so:

{% highlight ruby %}

  source "https://gemserver.com"

{% endhighlight %}


And now create an environment variable called `BUNDLE_GEMSERVER__COM`, this will match the url `gemserver.com`
where the dot (.) becomes two underscores (\_\_).

I would suggest you to wrap those two ENV's with the new `BUNDLE_*`, specially if you have to go and change your
continuous integration setup and then you have to go and change your staging and production servers, or maybe you are already using
those values somewhere in your project, don't worry you can wrap them like so:

{% highlight text %}

  BUNDLE_GEMSERVER__COM="$USERNAME:$PASSWORD"

{% endhighlight %}

This is equivalent of doing the following:

{% highlight text %}

  bundle config gems.unii.com $UNII_GEMS_USERNAME:$UNII_GEMS_PASSWORD

{% endhighlight %}

Now all you have to do is going through the all the stages of your project that need that ENV and you will be fine.

Also since I don't know which version of you are running and in which exactly version of bundler this was introduced, if you can, then update your bundler to the latest version, I've updated mine to 1.10.6 as version 1.7.4 didn't had this feature.

Thank you for reading.

David Silva
