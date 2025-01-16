import { RichText } from "./types"

export type PostsQuery = {
    object: string
    results: Array<PostsResults>
    next_cursor: string | null;
    has_more: boolean
    type: string
    page_or_database: never;
    request_id: string
  }
  
  export type PostsResults = {
    object: string
    id: string
    created_time: string
    last_edited_time: string
    created_by: {
      object: string
      id: string
    }
    last_edited_by: {
      object: string
      id: string
    }
    cover: null
    icon: null
    parent: {
      type: string
      database_id: string
    }
    archived: boolean
    in_trash: boolean
    properties: {
      "Last edited time": {
        id: string
        type: string
        last_edited_time: string
      }
      "Publish Date": {
        id: string
        type: string
        date?: {
          start: string
          end: unknown
          time_zone: null
        }
      }
      "SEO Description": {
        id: string
        type: string
        rich_text: Array<RichText>
      }
      thumbnail: {
        id: string
        type: string
        files: Array<{
          name: string
          type: string
          file: {
            url: string
            expiry_time: string
          }
        }>
      }
      slug: {
        id: string
        type: string
        rich_text: Array<RichText>
      }
      Hidden: {
        id: string
        type: string
        checkbox: boolean
      }
      "SEO Title": {
        id: string
        type: string
        rich_text: Array<RichText>
      }
      "Created time": {
        id: string
        type: string
        created_time: string
      }
      Tags: {
        id: string
        type: string
        multi_select: Array<{
          id: string
          name: string
          color: string
        }>
      }
      Status: {
        id: string
        type: string
        status: {
          id: string
          name: string
          color: string
        }
      }
      Name: {
        id: string
        type: string
        title: Array<{
          type: string
          text: {
            content: string
            link: string | null
          }
          annotations: {
            bold: boolean
            italic: boolean
            strikethrough: boolean
            underline: boolean
            code: boolean
            color: string
          }
          plain_text: string
          href: string | null
        }>
      }
    }
    url: string
    public_url: null
  }