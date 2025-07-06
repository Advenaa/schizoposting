# frozen_string_literal: true
class BidirectionalLinksGenerator < Jekyll::Generator
  def generate(site)
    @site = site
    @all_docs = site.collections['notes'].docs + site.pages
    @link_extension = site.config["use_html_extension"] ? '.html' : ''
    
    # Build efficient lookup structures once
    build_title_lookup_table
    
    # Process documents in a single pass
    process_wiki_links
    
    # Generate backlinks and graph data
    generate_backlinks_and_graph
  end

  private

  def build_title_lookup_table
    @title_to_doc = {}
    @filename_to_doc = {}
    
    @all_docs.each do |doc|
      # Map by title (from frontmatter)
      title = doc.data['title']
      @title_to_doc[title.downcase] = doc if title
      
      # Map by filename (without extension)
      filename = File.basename(doc.basename, File.extname(doc.basename))
      @filename_to_doc[filename.downcase] = doc
    end
  end

  def process_wiki_links
    @all_docs.each do |current_doc|
      process_document_links(current_doc)
      process_orphaned_links(current_doc)
    end
  end

  def process_document_links(current_doc)
    # Process all [[link]] patterns in the document
    current_doc.content.gsub!(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/) do
      link_target = $1.strip
      link_label = $2&.strip || link_target
      
      target_doc = find_target_document(link_target)
      
      if target_doc
        create_internal_link(target_doc, link_label)
      else
        # Keep original for orphaned link processing
        "[[#{link_target}#{ $2 ? "|#{$2}" : '' }]]"
      end
    end
  end

  def find_target_document(link_target)
    # Try exact title match first
    target_doc = @title_to_doc[link_target.downcase]
    return target_doc if target_doc
    
    # Try filename match
    target_doc = @filename_to_doc[link_target.downcase]
    return target_doc if target_doc
    
    # Try flexible matching (spaces/hyphens/underscores)
    normalized_target = normalize_title(link_target)
    
    @title_to_doc.each do |title, doc|
      return doc if normalize_title(title) == normalized_target
    end
    
    @filename_to_doc.each do |filename, doc|
      return doc if normalize_title(filename) == normalized_target
    end
    
    nil
  end

  def normalize_title(title)
    title.downcase.gsub(/[-_\s]+/, ' ').strip
  end

  def create_internal_link(target_doc, label)
    href = "#{@site.baseurl}#{target_doc.url}#{@link_extension}"
    "<a class='internal-link' href='#{href}'>#{label}</a>"
  end

  def process_orphaned_links(current_doc)
    # Convert remaining [[link]] patterns to disabled links
    current_doc.content.gsub!(/\[\[([^\]]+)\]\]/) do
      link_text = $1
      <<~HTML.delete("\n")
        <span title='There is no note that matches this link.' class='invalid-link'>
          <span class='invalid-link-brackets'>[[</span>
          #{link_text}
          <span class='invalid-link-brackets'>]]</span>
        </span>
      HTML
    end
  end

  def generate_backlinks_and_graph
    graph_nodes = []
    graph_edges = []
    
    # Build backlinks map
    backlinks_map = build_backlinks_map
    
    # Process each note for backlinks and graph data
    @all_docs.select { |doc| doc.collection&.label == 'notes' }.each do |note|
      next if note.path.include?('_notes/index.html')
      
      # Set backlinks for Jekyll
      note.data['backlinks'] = backlinks_map[note.url] || []
      
      # Add to graph nodes
      graph_nodes << create_graph_node(note)
      
      # Add to graph edges
      backlinks_map[note.url]&.each do |backlink_doc|
        graph_edges << {
          source: note_id_from_note(backlink_doc),
          target: note_id_from_note(note)
        }
      end
    end
    
    write_graph_data(graph_nodes, graph_edges)
  end

  def build_backlinks_map
    backlinks_map = Hash.new { |h, k| h[k] = [] }
    
    @all_docs.each do |doc|
      # Find all internal links in this document
      doc.content.scan(/href='[^']*?([^'\/]+(?:\.html)?)'/i) do |match|
        linked_path = match[0]
        
        # Find the document this links to
        @all_docs.each do |target_doc|
          if target_doc.url.include?(linked_path.gsub('.html', ''))
            backlinks_map[target_doc.url] << doc
            break
          end
        end
      end
    end
    
    backlinks_map
  end

  def create_graph_node(note)
    {
      id: note_id_from_note(note),
      path: "#{@site.baseurl}#{note.url}#{@link_extension}",
      label: note.data['title'] || File.basename(note.basename, File.extname(note.basename))
    }
  end

  def write_graph_data(nodes, edges)
    graph_data = {
      edges: edges,
      nodes: nodes
    }
    
    File.write('_includes/notes_graph.json', JSON.dump(graph_data))
  end

  def note_id_from_note(note)
    title = note.data['title'] || File.basename(note.basename, File.extname(note.basename))
    title.bytes.join
  end
end
