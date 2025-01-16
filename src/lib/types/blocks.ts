export type PostBlocks = PostBlock[]

export interface PostBlock {
  object: string
  id: string
  parent: Parent
  created_time: string
  last_edited_time: string
  created_by: CreatedBy
  last_edited_by: LastEditedBy
  has_children: boolean
  archived: boolean
  in_trash: boolean
  type: string
  numbered_list_item?: NumberedListItem
  paragraph?: Paragraph
  image?: Image
  code?: Code
  heading_3?: Heading3
  heading_2?: Heading2;
}

export interface Parent {
  type: string
  page_id: string
}

export interface CreatedBy {
  object: string
  id: string
}

export interface LastEditedBy {
  object: string
  id: string
}

export interface NumberedListItem {
  rich_text: RichText[]
  color: string
}

export interface RichText {
  type: string
  text: Text
  annotations: Annotations
  plain_text: string
  href: string | null
}

export interface Text {
  content: string
  link: string | null
}

export interface Annotations {
  bold: boolean
  italic: boolean
  strikethrough: boolean
  underline: boolean
  code: boolean
  color: string
}

export interface Paragraph {
  rich_text: RichText2[]
  color: string
}

export interface RichText2 {
  type: string
  text: Text2
  annotations: Annotations2
  plain_text: string
  href?: string
}

export interface Text2 {
  content: string
  link?: Link
}

export interface Link {
  url: string
}

export interface Annotations2 {
  bold: boolean
  italic: boolean
  strikethrough: boolean
  underline: boolean
  code: boolean
  color: string
}

export interface Image {
  caption: never
  type: string
  file: File
}

export interface File {
  url: string
  expiry_time: string
}

export interface Code {
  caption: never
  rich_text: RichText3[]
  language: string
}

export interface RichText3 {
  type: string
  text: Text3
  annotations: Annotations3
  plain_text: string
  href: string | null
}

export interface Text3 {
  content: string
  link: string | null
}

export interface Annotations3 {
  bold: boolean
  italic: boolean
  strikethrough: boolean
  underline: boolean
  code: boolean
  color: string
}
export interface Heading2 {
  rich_text: RichText4[]
  is_toggleable: boolean
  color: string
}

export interface Heading3 {
  rich_text: RichText4[]
  is_toggleable: boolean
  color: string
}

export interface RichText4 {
  type: string
  text: Text4
  annotations: Annotations4
  plain_text: string
  href: string | null
}

export interface Text4 {
  content: string
  link: string | null
}

export interface Annotations4 {
  bold: boolean
  italic: boolean
  strikethrough: boolean
  underline: boolean
  code: boolean
  color: string
}
