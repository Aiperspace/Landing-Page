export interface DocumentSection {
  title: string;
  content: string;
}

export interface GeneratedDocument {
  title: string;
  sections: DocumentSection[];
}

export interface RecentDocument {
  id: string;
  title: string;
  templateId: string;
  doc: GeneratedDocument;
}
