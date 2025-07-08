module Jekyll
  class ExcerptGenerator < Generator
    safe true
    priority :normal

    def generate(site)
      site.collections['notes'].docs.each do |doc|
        # Skip if excerpt is already defined
        next if doc.data['excerpt']
        
        # Get the content without front matter
        content = doc.content.strip
        
        # Remove markdown formatting and get first paragraph
        excerpt = content
          .gsub(/^#+\s+.*$/, '') # Remove headers
          .gsub(/^>.*$/, '') # Remove blockquotes
          .gsub(/^[-*+]\s+.*$/, '') # Remove list items
          .gsub(/^[0-9]+\.\s+.*$/, '') # Remove numbered lists
          .gsub(/```.*?```/m, '') # Remove code blocks
          .gsub(/\[\[.*?\]\]/, '') # Remove internal links
          .gsub(/\[.*?\]\(.*?\)/, '') # Remove markdown links
          .gsub(/\*\*.*?\*\*/, '') # Remove bold
          .gsub(/\*.*?\*/, '') # Remove italic
          .gsub(/`.*?`/, '') # Remove inline code
          .gsub(/\n+/, ' ') # Replace newlines with spaces
          .strip
        
        # Take first 150 characters and add ellipsis if longer
        if excerpt.length > 150
          excerpt = excerpt[0..147] + '...'
        end
        
        # Only set excerpt if we have meaningful content
        if excerpt.length > 20
          doc.data['excerpt'] = excerpt
        end
      end
    end
  end
end 