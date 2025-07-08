module Jekyll
  class ObsidianImageConverter < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      # Process all pages
      site.pages.each do |page|
        convert_obsidian_images(page)
      end
      # Process all docs in all collections (including custom ones like notes)
      site.collections.each_value do |collection|
        collection.docs.each do |doc|
          convert_obsidian_images(doc)
        end
      end
    end

    private

    def convert_obsidian_images(page)
      return unless page.content
      
      # Convert ![[filename]] to ![filename](/assets/filename)
      page.content = page.content.gsub(/!\[\[([^\]]+)\]\]/) do |match|
        filename = $1.strip
        # Handle different file extensions
        if filename.match?(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
          "![#{filename}](/assets/#{filename})"
        else
          # If no extension, assume it's a jpg
          "![#{filename}](/assets/#{filename}.jpg)"
        end
      end
    end
  end
end 