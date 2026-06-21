#!/usr/bin/env ruby
# build-book-manifest.rb <quire.yml> <book_key> <out.yml>
# Generates a Jekyll _data manifest for the book reading layout from a Quire config.
# Precomputes part labels, per-entry prev/next (skipping part dividers) and a locator,
# so the Jekyll layout stays dumb. Run after `quire build`; never drifts from the source.
require "yaml"

qpath, book_key, outpath = ARGV
abort "usage: build-book-manifest.rb <quire.yml> <book_key> <out.yml>" unless outpath
q = YAML.load_file(qpath)
prefix = q.dig("output", "jekyll", "prefix") || "books/#{book_key}"

# part-divider slug (== chapters' `section`) -> human label
part_label = {}
q["chapters"].each do |c|
  next unless c["type"] == "part-divider"
  part_label[c["slug"]] = c["subtitle"] ? "#{c['title']} · #{c['subtitle']}" : c["title"]
end

entries = q["chapters"].map do |c|
  if c["type"] == "part-divider"
    { "type" => "part-divider",
      "part" => (c["subtitle"] ? "#{c['title']} · #{c['subtitle']}" : c["title"]) }
  else
    sec  = c["section"]
    type = { "front-matter" => "front-matter", "appendices" => "appendix" }[sec] || "chapter"
    part = { "front-matter" => "Front Matter", "appendices" => "Appendices" }[sec] || part_label[sec] || sec
    { "slug" => c["slug"], "url" => "/#{prefix}/#{c['slug']}/",
      "title" => c["title"], "part" => part, "type" => type }
  end
end

# readable = real pages (drop dividers); same object refs as in `entries`
readable = entries.reject { |e| e["type"] == "part-divider" }
chap_total = readable.count { |e| e["type"] == "chapter" }
app_total  = readable.count { |e| e["type"] == "appendix" }
seen = Hash.new(0)
readable.each do |e|
  seen[e["type"]] += 1
  e["locator"] = case e["type"]
                 when "chapter"  then "Chapter #{seen['chapter']} of #{chap_total}"
                 when "appendix" then "Appendix #{seen['appendix']} of #{app_total}"
                 else "Front matter"
                 end
end
readable.each_with_index do |e, i|
  e["prev"] = { "url" => readable[i - 1]["url"], "title" => readable[i - 1]["title"] } if i > 0
  e["next"] = { "url" => readable[i + 1]["url"], "title" => readable[i + 1]["title"] } if i < readable.size - 1
end

manifest = {
  "title"       => q["title"],
  "short_title" => q["title"].split(":").first.strip,
  "subtitle"    => q["subtitle"],
  "author"      => q["author"],
  "home"        => "/#{prefix}/",
  "chapters"    => entries,
}
require "fileutils"; FileUtils.mkdir_p(File.dirname(outpath))
File.write(outpath, manifest.to_yaml)
puts "wrote #{outpath}: #{entries.size} entries (#{readable.size} pages, #{chap_total} chapters, #{app_total} appendices)"
