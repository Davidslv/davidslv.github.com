---
layout: post
title:  "Setup a Raspiberry Pi to mine cryptocurrency"
date:   2015-10-08 01:00:00
categories: cryptocurrency
tags: [cryptocurrency, blackcoin, mining, raspberry-pi]
---

I've been [mining](https://en.bitcoin.it/wiki/Mining){:target="\_blank"} since May 2015, with 3 [Rockminer R-BOX](http://ecx.images-amazon.com/images/I/81J3I--QY5L._SY355_.jpg){:target="\_blank"} giving a total of 300Gh/s,
although it sounds like a lot of speed, I wouldn't recommend you to mine [Bitcoins](https://bitcoin.org/en/){:target="\_blank"} as that requires much more [hash rate](https://bitcoin.org/en/vocabulary#hash-rate){:target="\_blank"} to be processed, and you will be spending more money in electricity than getting any Bitcoins.
You should assume that at this moment mining should be seen as non-profitable hobby, my main goal was just to fulfill my curiosity.

The hardware I used:

- 1 raspberry pi (Quad Core), I used other models but they crashed after a few hours...
- 1 usb hub
- 1 corsair CX 600M Power Supply
- 3 Rockminer R-BOX


Assuming you already have the operating system [Raspbian](https://www.raspberrypi.org/downloads/){:target="\_blank"}, open the command line (Terminal) and type the following:

{% highlight text %}
    sudo apt-get update && sudo apt-get install libusb-1.0-0-dev libusb-1.0-0 libcurl4-openssl-dev libncurses5-dev libudev-dev -y
{% endhighlight %}

When you finished updating and installing the needed packages go ahead and download **cgminer** (that's the latest stable version at the moment of my writing)

{% highlight text %}
    wget http://ck.kolivas.org/apps/cgminer/cgminer-4.9.1.tar.bz2
{% endhighlight %}

And then "unzip" it

{% highlight text %}
    tar xvf cgminer-4.9.1.tar.bz2
{% endhighlight %}

Enter **cgminer** directory:

{% highlight text %}
    cd cgminer-4.9.1/
    ./configure --enable-icarus
    sudo make && sudo make install
{% endhighlight %}

After installing it all you need to do is to find a mining pool to join. And the **stratum** url will be given to you, make sure you setup a worker and a password for it.

Then all you need to do is:

{% highlight text %}
    cgminer --icarus-options 115200:1:1 -o stratum+tcp://MININGPOOL_URL_HERE.com:2222 -u WORKER_NAME_HERE -p PASSWORD_HERE
{% endhighlight %}

When you see that everything is up and running I recommend you to write that command in **/etc/rc.local** so it starts mining on startup, avoiding you to have to write it all the time you restart your raspberry pi.

Have fun, enjoy the noise :D

David Silva
