#!/bin/bash
# Contributor analysis from git history

# Analyze recent contributors
analyze_contributors() {
    local repo_path="$1"
    local commit_limit="${2:-20}"

    if [ ! -d "$repo_path/.git" ]; then
        log_warning "Not a git repository: $repo_path"
        echo "[]"
        return 0
    fi

    if ! cd "$repo_path"; then
        log_error "Failed to access repository: $repo_path"
        echo "[]"
        return 1
    fi

    log_info "Analyzing recent $commit_limit contributors"

    # Get commits data
    local commits_data
    commits_data=$(git log -"$commit_limit" --pretty=format:'%an|%ae|%ad|%h' --date=iso 2>/dev/null || echo "")

    if [ -z "$commits_data" ]; then
        log_info "No git history available"
        echo "[]"
        return 0
    fi

    # Create temporary file for processing
    local contributors_file
    contributors_file=$(mktemp)

    # Process commits and aggregate by author email
    echo "$commits_data" | while IFS='|' read -r author_name author_email commit_date commit_hash; do
        echo "$author_email|$author_name|$commit_date|$commit_hash"
    done | awk -F'|' '
    {
        email = $1
        name = $2
        date = $3
        hash = $4

        # Count commits per author
        count[email]++

        # Store name (last occurrence)
        names[email] = name

        # Store most recent date and hash (first occurrence is most recent due to git log order)
        if (!(email in dates)) {
            dates[email] = date
            hashes[email] = hash
        }
    }
    END {
        for (email in count) {
            # Convert ISO 8601 date to UTC timestamp for JSON
            # Remove timezone for simplicity, keep ISO format
            gsub(/ [-+][0-9]+$/, "", dates[email])
            gsub(/ /, "T", dates[email])
            print names[email] "|" email "|" count[email] "|" dates[email] "Z|" hashes[email]
        }
    }
    ' | sort -t'|' -k3 -rn > "$contributors_file"

    # Convert to JSON array
    local contributors_json
    contributors_json=$(jq -R -n '
        [inputs |
         split("|") |
         {
             name: .[0],
             email: .[1],
             commit_count: (.[2] | tonumber),
             last_commit_date: .[3],
             last_commit_hash: .[4]
         }]
    ' < "$contributors_file")

    rm -f "$contributors_file"

    # Ensure contributors_json is never empty
    if [ -z "$contributors_json" ]; then
        log_warning "Failed to generate contributors JSON, returning empty array"
        contributors_json="[]"
    fi

    local contributors_count
    contributors_count=$(echo "$contributors_json" | jq 'length')
    log_info "Found $contributors_count contributor(s) in last $commit_limit commits"

    echo "$contributors_json"
}

# Get total contributor count
get_contributor_count() {
    local contributors_json="$1"

    echo "$contributors_json" | jq 'length'
}

# Get top contributor
get_top_contributor() {
    local contributors_json="$1"

    echo "$contributors_json" | jq -r '.[0].email // "unknown"'
}
