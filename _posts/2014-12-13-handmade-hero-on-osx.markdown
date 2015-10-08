---
layout: post
title:  "Handmade Hero on OSX"
date:   2014-12-13 22:40:00
categories: c++ handmade gamedev
---

I've been following [Handmade Hero](http://handmadehero.org/){:target="\_blank"} basically since the beginning,
although I know myself too well to start watching the videos straight away, it's like
watching a TV-Show and when the episode ends you just want to jump to the next one!
I simply can't wait! So I gave it time to have more videos and then I can catch up.

Now was the moment for me to start, there are 20 videos on [Youtube](https://www.youtube.com/user/handmadeheroarchive){:target="\_blank"},
[Casey Muratori](http://mollyrocket.com/casey/about.html){:target="\_blank"} has been doing an excelent work explaining everything to us and
I just can't wait to start seeing more and more! Also I liked it so much that I contributed by Pre-Ordering which gives you access to the source code.


There's only one problem, I only use OSX as my Operative System and right now the videos are very focused on Windows Operative System,
but that is no show stopper! No, no, no!

Furtunately there's been a lot of attention, and lots of people believe in this project and they have been helping out!
I found out that [David Gow](http://davidgow.net/){:target="\_blank"} is doing a port for Linux which he called it
[Handmade Penguin](http://davidgow.net/handmadepenguin/){:target="\_blank"} and I'm very grateful for that!

There's a few caveats from following David's code, because Linux and Unix are
very similar systems, but as they say the beauty (or headache) is in the details!

**Some tips:**

- You should install [SDL](https://www.libsdl.org/download-2.0.php){:target="\_blank"} from source, so you have it available on the terminal.
- David suggests KDevelop for debugging, but you will not find it on OSX, I found instead [Clewn](http://clewn.sourceforge.net/install.html){:target="\_blank"},
but I didn't install it as it depends on netbeans and felt like too much effort for now, maybe on a later stage.

## Surprise, Surprise!

I followed Chapter 1 and Chapter 2, when I finished my code on Chapter 2 based on David's I notice that something was wrong,
initially I thought that I had missed something, the window was suppose to be flickery when it was resized or dragged around,
but such thing wasn't happening, so I decided to print some text inside the case statement, just in case it was too fast for my eyes to catch,
but after some resizes and dragging around my text didn't appear, so there was only one explanation, it wasn't getting inside the case statement.
As I'm not a game developer I felt the need to contact David and tell him about the situation.

I sent him the following email

{% highlight text %}
Hello David,

Thanks for your time writing the Handmade Hero for Linux,
for the past 4 hours I've been reading, setup and coding what you wrote
but on OSX (sorry, it's the only platform I have =D )

And I'm emailing you because I think something unexpected happened
(I even copy pasted your code to see if I missed something, but I didn't).

According to your description the window is suppose to flicker between
black and white when the window is resized or dragged around,
although at least in OSX the case statement for SDL_WINDOWEVENT_EXPOSED
is never executed, and I know that because I added a printf in the beginning,
and as you can see in the screenshot the message never appears.

Do you have any idea why this happens?
I have the code on github if you just want to double check,
but is basically the same as if I had copy pasted your code.
https://github.com/Davidslv/handmade-fan

Thank you for your time and enjoy your weekend,
David Silva
{% endhighlight %}


For my surprise David actually answered my email, which I think it was very kind of him,
honestly there's not that many developers that take their time to answer, specially on a weekend!
His answer was very friendly and detailed why the situation differs from both operating systems.

{% highlight text %}
Hi,

Glad you're enjoying Handmade Penguin.

I _do_ in fact have an idea as to why this happens! Basically OSX
behaves a bit differently: expose messages don't happen by default.

We can look through the SDL code to see how things work. The code
to generate the SDL_WINDOWEVENT_EXPOSED event on OSX is in a "handler"
for the "windowDidExpose" notification:

https://hg.libsdl.org/SDL/file/a40415296b77/src/video/cocoa/SDL_cocoawindow.m#l459

This is a bit hard to find, but if we look at the Apple documentation here:

https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/WinPanel/Tasks/SettingWindowImageAttr.html

We see that windows on OSX can have different "backing store" types.
There are three types "buffered", "retained" and "nonretained". Of
these, "nonretained" behaves as one would expect: only the exposed
regions are redrawn and we get expose events. "buffered" behaves more
like a compositing window manager: we render the window to an offscreen
buffer, and the system then redraws the contents of that when needed.
SDL uses a buffered window (it's the default), and so never gets exposed
events.

Ultimately, the only difference we have is that OSX doesn't sent Exposed
messages when the window is resized, whereas X11 usually does.
You could get back the behaviour by running your draw code in the
SDL_WINDOWEVENT_RESIZED (or SDL_WINDOWEVENT_SIZE_CHANGED) event handlers.

Cheers,
— David
{% endhighlight %}

I think this is very important to share because allows people to understand that
different operating systems behave differently even when they are quite similar.

And as David says "this is a bit hard to find", if he never replied I probably
would never get it because SDL, C++ and game developing itself is out of my
comfort zone, I don't do it on a daily basis which makes it difficult to know
what to search for when you are in need.


Thank you for reading,

David Silva
