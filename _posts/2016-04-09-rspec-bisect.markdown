---
layout: post
title:  "Use Rspec bisect"
date:   2016-04-09 16:00:00
categories: ruby
---

Have you ever debugged code by commenting out half of it and seeing if the error still occurs, and if not, then trying the other half? And then half again of the problematic section? And so on... Then you've done a binary search.

If you've ever done this, you know it can be a time consuming process. With a large test suite, and a huge number of possible orderings of them, it would take a long time to find an order-dependent failure manually. Fortunately, [Rspec bisect](https://relishapp.com/rspec/rspec-core/docs/command-line/bisect){:target="\_blank"} automates this process for us.

{% highlight text %}
$ rspec spec --bisect --seed 61655
{% endhighlight %}
