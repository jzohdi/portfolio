import type { DatabaseQuery, NotionDatabaseEntry, NotionNumber, RichText } from "./types";

export type Project = {
    title: string;
    link: string;
    thumbnail: string;
    description: string;
    source?: string;
}

export type ProjectsQuery = DatabaseQuery<ProjectResult>;
export type ProjectResult = NotionDatabaseEntry<Properties>

  
  export interface CreatedBy {
    object: string
    id: string
  }
  
  export interface LastEditedBy {
    object: string
    id: string
  }
  
  export interface Parent {
    type: string
    database_id: string
  }
  
  export interface Properties {
    published: Published
    link: Link
    description: Description
    thumbnail: Thumbnail
    Name: Name
    source: Link
    order: NotionNumber
  }
  
  export interface Published {
    id: string
    type: string
    checkbox: boolean
  }
  
  export interface Link {
    id: string
    type: string
    url: string
  }
  
  export interface Description {
    id: string
    type: string
    rich_text: Array<RichText>
  }
  
  
  export interface Text {
    content: string
    link: string | null;
  }
  
  export interface Annotations {
    bold: boolean
    italic: boolean
    strikethrough: boolean
    underline: boolean
    code: boolean
    color: string
  }
  
  export interface Thumbnail {
    id: string
    type: string
    files: File[]
  }
  
  export interface File {
    name: string
    type: string
    file: File2
  }
  
  export interface File2 {
    url: string
    expiry_time: string
  }
  
  export interface Name {
    id: string
    type: string
    title: Title[]
  }
  
  export interface Title {
    type: string
    text: Text2
    annotations: Annotations2
    plain_text: string
    href: string | null;
  }
  
  export interface Text2 {
    content: string
    link: string | null;
  }
  
  export interface Annotations2 {
    bold: boolean
    italic: boolean
    strikethrough: boolean
    underline: boolean
    code: boolean
    color: string
  }

  