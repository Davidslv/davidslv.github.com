---
layout: post
title:  "Building a cache mechanism"
date:   2016-01-07 17:00:00
categories: ruby
---

A few days ago I implemented a [Cache](https://en.wikipedia.org/wiki/Cache_(computing)){:target="\_blank"} mechanism in ruby, initially I was about to use Redis, it allows you to create keys with values and also set an expiration time.

The caveat is that by using Redis this tiny app was depending in another 3rd party software to run
and I didn’t wanted to end up depending in anything else for this particular case.
By the way, I did thought about memcached but then again I didn’t wanted extra dependencies.

The purpose of this caching mechanism is to prevent calling the database every time we need to count how many records are in different tables. Instead it will read the value from the cache until that value expires.

So a few minutes later I had a tested working solution:

{% highlight ruby %}
class Cache

  def initialize
    @cache ||= {}
  end

  def add(resource, options = {})
    value          = options.fetch(:value) { nil }
    expire_in_secs = options.fetch(:expire_in_secs) { 300 }

    @cache[resource] = { value: value, expire_at: Time.now + expire_in_secs }
  end

  def read(resource)
    resource = @cache[resource]

    return unless @cache[resource]
    return if resource[:expire_at] < Time.now

    resource[:value]
  end

  def clear
    @cache = {}
  end
end
{% endhighlight %}

**Note:** You can find the spec file in this **[gist](https://gist.githubusercontent.com/Davidslv/1d3ac9f22c5e7edb6c6e/raw/f9c95bec3dc70855a55b4eea487f22d07fd50f22/cache_spec.rb){:target="\_blank"}**.

There was just a problem, this will run in a Threaded Web Server, and guess what? This code is not thread-safe.

There’s a few things we need to know:

- Ruby core classes are not thread-safe
- It will work as intended under MRI because of GIL (Global Interpreter Lock)
- It will not work as intended under Rubinius or Jruby

### How can we solve this?

We can use a Mutex, which is a shorthand for “mutual exclusion”, it implements a simple semaphore to coordinate access to shared data from multiple concurrent threads.

{% highlight ruby %}
class Cache

  def initialize
    @cache ||= {}
    @lock  = Mutex.new
  end

  def add(resource, options = {})
    value          = options.fetch(:value) { nil }
    expire_in_secs = options.fetch(:expire_in_secs) { 300 }

    @lock.synchronize do
      @cache[resource] = { value: value, expire_at: (Time.now + expire_in_secs) }
    end
  end

  def read(resource)
    resource = @cache[resource]

    return unless resource
    return if resource[:expire_at] < Time.now

    resource[:value]
  end

  def clear
    @cache = {}
  end
end
{% endhighlight %}

Now you could argue that I should also lock while reading, but in reality for the purpose of the code it really doesn’t matter, the only thing it may happen is to have an earlier count and we are a few numbers behind than we were suppose to.

### How can you make sure it is thread safe?

You can spawn a few threads and increase the value of the key, so if we create 400 threads each adding 10 times you should expect the last value to be 4000.

{% highlight ruby %}
cache   = Cache.new
threads = Array.new

1.upto(400) do |i|
  threads << Thread.new do
    1.upto(10) do |j|
      cache.add(:b, value: (i * j))
    end
  end
end

threads.each(&:join)
cache.read(:b)
{% endhighlight %}

We expect the value to be always 4000 when running this code.

I hope you enjoyed


References:

- [Ruby core classes aren't thread safe](http://www.jstorimer.com/pages/ruby-core-classes-arent-thread-safe){:target="\_blank"}
- [Global Interpreter Lock](https://en.wikipedia.org/wiki/Global_interpreter_lock){:target="\_blank"}
