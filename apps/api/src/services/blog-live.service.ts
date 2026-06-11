import { EventEmitter } from "node:events";

type BlogCommentEvent = {
  slug: string;
  payload: unknown;
};

class BlogLiveEvents extends EventEmitter {
  emitComment(event: BlogCommentEvent) {
    this.emit("blog:comment", event);
  }
}

export const blogLiveEvents = new BlogLiveEvents();
