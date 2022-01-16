from django.db import models

# Create your models here.
class TOC:
  def __init__(self, title, content, level, read_time):
    self.title = title
    self.content = content
    self.level = level
    self.read_time = read_time